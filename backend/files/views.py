# files/views.py
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils.text import slugify

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend


from .models import File
from .serializers import FileSerializer
from notifications.services import create_notification
from activity_logs.services import create_activity
from accounts.models import CustomUser


def _group_send(group_name: str, event: dict):
    """
    Safe group_send: if channel layer isn't available it won't crash.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(group_name, event)


def notify_new_file(file_instance: File):
    admin_event = {
        "type": "file_notification",
        "message": f"New file uploaded: {file_instance.original_name}",
        "file": {
            "id": str(file_instance.id),
            "originalName": file_instance.original_name,
            "status": file_instance.status,
            "userName": getattr(file_instance.user, "first_name", "") or getattr(file_instance.user, "username", ""),
            "userEmail": getattr(file_instance.user, "email", ""),
            "createdAt": file_instance.created_at.isoformat()
            if getattr(file_instance, "created_at", None)
            else None,
            "description": getattr(file_instance, "description", ""),
        },
    }
    _group_send("files_admin", admin_event)


def notify_file_status_update(file_instance: File):
    uploader_email = getattr(file_instance.user, "email", "")
    uploader_slug = slugify(uploader_email) if uploader_email else 'anonymous'
    uploader_group = f'files_{uploader_slug}'

    event = {
        "type": "file_status_update",
        "fileId": str(file_instance.id),
        "status": file_instance.status,
        "adminNote": getattr(file_instance, "admin_note", "") or "",
    }

    # Notify the uploader directly about approval/rejection
    _group_send(uploader_group, event)
    # Also notify admins about file status changes if needed
    _group_send("files_admin", event)


class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.select_related("user").all().order_by("-created_at")
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        DjangoFilterBackend,
    ]

    search_fields = [
        'original_name',
        'description',
        'user__email',
        'user__first_name',
    ]

    filterset_fields = [
        'status',
        'shared',
    ]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return File.objects.select_related(
                "user"
            ).all().order_by("-created_at")

        return File.objects.select_related(
            "user"
        ).filter(
            user=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')

        if not uploaded_file:
            raise ValidationError('No file uploaded.')

        file_instance = serializer.save(
            user=self.request.user,
            original_name=uploaded_file.name,
            mime_type=uploaded_file.content_type,
            size=uploaded_file.size,
            file_name=uploaded_file.name,
        )

        create_activity(
            self.request.user,
            'upload_file',
            f'Uploaded file {file_instance.original_name}'
        )

        admins = CustomUser.objects.filter(
            role='admin'
        )

        for admin in admins:
            create_notification(
                user=admin,
                title='New File Uploaded',
                message=f'{file_instance.user.email} uploaded a file for review.',
                notification_type='file'
            )

        notify_new_file(file_instance)

    

    def perform_update(self, serializer):
        file_instance = serializer.save()
        # Optional: broadcast full file update
        notify_file_status_update(file_instance)

    def perform_destroy(self, instance):
        create_activity(
            self.request.user,
            'delete_file',
            f'Deleted file {instance.original_name}'
        )

        instance.delete()
    
    @action(detail=True, methods=["patch"], url_path="update_status")
    def update_status(self, request, pk=None):
        """
        PATCH /files/{id}/update_status/
        Body: { "status": "approved", "adminNote": "..." }
        """
        file_instance = self.get_object()
        new_status = request.data.get("status")
        admin_note = request.data.get("adminNote", None)

        if not new_status:
            return Response({"detail": "status is required"}, status=400)

        file_instance.status = new_status
        if admin_note is not None and hasattr(file_instance, "admin_note"):
            file_instance.admin_note = admin_note

        file_instance.save()
        if file_instance.status == 'approved':
            create_notification(
                user=file_instance.user,
                title='File Approved',
                message=f'Your file "{file_instance.original_name}" has been approved.',
                notification_type='file'
            )
            create_activity(
                request.user,
                'approve_file',
                f'Approved file {file_instance.original_name}'
            )

        elif file_instance.status == 'rejected':
            create_notification(
                user=file_instance.user,
                title='File Rejected',
                message=f'Your file "{file_instance.original_name}" has been rejected.',
                notification_type='file'
            )

            create_activity(
                request.user,
                'reject_file',
                f'Rejected file {file_instance.original_name}'
            )

        notify_file_status_update(file_instance)
        return Response(FileSerializer(file_instance).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def share_file(self, request, pk=None):

        file_instance = self.get_object()

        user_ids = request.data.get('user_ids', [])

        if not user_ids:
            return Response(
                {'message': 'user_ids required'},
                status=400
            )

        users = CustomUser.objects.filter(
            id__in=user_ids
        )

        file_instance.shared = True
        file_instance.shared_with.add(*users)
        file_instance.save()
        create_activity(
            request.user,
            'share_file',
            f'Shared file {file_instance.original_name}'
        )

        for user in users:
            create_notification(
                user=user,
                title='File Shared',
                message=f'{file_instance.user.email} shared a file with you.',
                notification_type='file'
            )

        return Response(
            {'message': 'File shared successfully'}
        )

    @action(detail=False, methods=['get'])
    def shared_files(self, request):

        files = request.user.shared_files.select_related(
        "user"
        ).all().order_by("-created_at")

        serializer = FileSerializer(
            files,
            many=True
        )

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def unshare_file(self, request, pk=None):

        file_instance = self.get_object()

        user_ids = request.data.get('user_ids', [])

        users = CustomUser.objects.filter(
            id__in=user_ids
        )

        file_instance.shared_with.remove(*users)

        if not file_instance.shared_with.exists():
            file_instance.shared = False
            file_instance.save()

            create_activity(
                request.user,
                'unshare_file',
                f'Unshared file {file_instance.original_name}'
            )

        return Response(
            {'message': 'File unshared successfully'}
        )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        files = self.get_queryset()

        return Response({
            'totalFiles': files.count(),
            'pendingFiles': files.filter(
                status='pending'
            ).count(),
            'approvedFiles': files.filter(
                status='approved'
            ).count(),
            'rejectedFiles': files.filter(
                status='rejected'
            ).count(),
            'sharedFiles': files.filter(
                shared=True
            ).count(),
        })

    @action(detail=False, methods=['get'])
    def recent_files(self, request):
        files = self.get_queryset()[:5]

        serializer = self.get_serializer(
            files,
            many=True
        )

        return Response(serializer.data)