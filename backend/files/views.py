# files/views.py
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils.text import slugify
from django.utils import timezone
from django.db import transaction
from django.core.files.storage import default_storage
from django.http import FileResponse
import os
import uuid

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
    file_payload = {
        "id": str(file_instance.id),
        "originalName": file_instance.original_name,
        "status": file_instance.status,
        "userId": getattr(file_instance.user, "id", None),
        "userName": getattr(file_instance.user, "first_name", "") or getattr(file_instance.user, "username", ""),
        "userEmail": getattr(file_instance.user, "email", ""),
        "createdAt": file_instance.created_at.isoformat()
        if getattr(file_instance, "created_at", None)
        else None,
        "updatedAt": file_instance.updated_at.isoformat()
        if getattr(file_instance, "updated_at", None)
        else None,
        "description": getattr(file_instance, "description", ""),
        "size": getattr(file_instance, "size", None),
        "mimeType": getattr(file_instance, "mime_type", ""),
        "url": getattr(file_instance, "url", ""),
        "fileName": getattr(file_instance, "file_name", ""),
        "cloudinaryId": getattr(file_instance, "cloudinary_id", ""),
        "shared": getattr(file_instance, "shared", False),
    }

    admin_event = {
        "type": "file_notification",
        "message": f"New file uploaded: {file_instance.original_name}",
        "file": file_payload,
    }

    uploader_email = getattr(file_instance.user, "email", "")
    uploader_slug = slugify(uploader_email) if uploader_email else 'anonymous'
    uploader_group = f'files_{uploader_slug}'

    _group_send("files_admin", admin_event)
    _group_send(uploader_group, admin_event)


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


def notify_file_share_update(file_instance: File, actor, action: str, target_users=None):
    uploader_email = getattr(file_instance.user, "email", "")
    uploader_slug = slugify(uploader_email) if uploader_email else 'anonymous'
    uploader_group = f'files_{uploader_slug}'

    target_users = list(target_users or [])
    target_user_ids = [str(getattr(user, 'id', '')) for user in target_users if getattr(user, 'id', None)]

    payload = {
        "type": "file_share_update",
        "action": action,
        "actorEmail": getattr(actor, 'email', ''),
        "file": FileSerializer(file_instance).data,
        "targetUserIds": target_user_ids,
    }

    _group_send("files_admin", payload)
    _group_send(uploader_group, payload)

    for user in target_users:
        user_email = getattr(user, 'email', '')
        user_slug = slugify(user_email) if user_email else None
        if user_slug:
            _group_send(f'files_{user_slug}', payload)


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

        # Persist uploaded bytes to configured storage backend and keep a durable URL.
        original_name = uploaded_file.name or f'upload-{uuid.uuid4().hex}'
        safe_name = os.path.basename(original_name)
        stored_path = default_storage.save(
            f"uploads/{uuid.uuid4().hex}_{safe_name}",
            uploaded_file,
        )
        stored_url = self.request.build_absolute_uri(default_storage.url(stored_path))

        file_instance = serializer.save(
            user=self.request.user,
            original_name=original_name,
            mime_type=uploaded_file.content_type or 'application/octet-stream',
            size=uploaded_file.size,
            file_name=os.path.basename(stored_path),
            url=stored_url,
            cloudinary_id=stored_path,
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

    def _apply_file_status_change(self, file_instance, new_status, admin_note, actor):
        file_instance.status = new_status
        if admin_note is not None and hasattr(file_instance, 'admin_note'):
            file_instance.admin_note = admin_note

        if new_status in {'reviewing', 'approved', 'rejected'}:
            file_instance.reviewed_by = actor
            file_instance.reviewed_at = timezone.now()

        file_instance.save()

        if file_instance.status == 'reviewing':
            create_notification(
                user=file_instance.user,
                title='File Under Review',
                message=f'Your file "{file_instance.original_name}" is now under review.',
                notification_type='file'
            )
            create_activity(
                actor,
                'review_file',
                f'Marked file {file_instance.original_name} as reviewing'
            )

        elif file_instance.status == 'approved':
            create_notification(
                user=file_instance.user,
                title='File Approved',
                message=f'Your file "{file_instance.original_name}" has been approved.',
                notification_type='file'
            )
            create_activity(
                actor,
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
                actor,
                'reject_file',
                f'Rejected file {file_instance.original_name}'
            )

        notify_file_status_update(file_instance)
        return file_instance

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
        valid_statuses = {'pending', 'reviewing', 'approved', 'rejected'}

        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can update review status'}, status=403)

        if not new_status:
            return Response({"detail": "status is required"}, status=400)

        if new_status not in valid_statuses:
            return Response({"detail": "Invalid status"}, status=400)

        updated = self._apply_file_status_change(file_instance, new_status, admin_note, request.user)

        return Response(FileSerializer(updated).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['patch'], url_path='bulk_update_status')
    def bulk_update_status(self, request):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can update review status'}, status=403)

        ids = request.data.get('ids', [])
        new_status = request.data.get('status')
        admin_note = request.data.get('adminNote', None)
        valid_statuses = {'pending', 'reviewing', 'approved', 'rejected'}

        if not isinstance(ids, list) or not ids:
            return Response({'detail': 'ids must be a non-empty list'}, status=400)

        if new_status not in valid_statuses:
            return Response({'detail': 'Invalid status'}, status=400)

        files_qs = File.objects.filter(id__in=ids).select_related('user')
        found_ids = {str(f.id) for f in files_qs}
        missing_ids = [file_id for file_id in ids if str(file_id) not in found_ids]
        if missing_ids:
            return Response({'detail': 'Some files were not found', 'missingIds': missing_ids}, status=404)

        updated_files = []
        with transaction.atomic():
            for file_instance in files_qs:
                updated_files.append(
                    self._apply_file_status_change(file_instance, new_status, admin_note, request.user)
                )

        return Response(
            {
                'updatedCount': len(updated_files),
                'files': FileSerializer(updated_files, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='send_to_admin')
    def send_to_admin(self, request, pk=None):
        file_instance = self.get_object()

        if request.user.role == 'admin':
            return Response({'detail': 'Admins cannot send files for review'}, status=400)

        if file_instance.user_id != request.user.id:
            return Response({'detail': 'You can only send your own files to admin'}, status=403)

        if file_instance.status in {'pending', 'reviewing'}:
            return Response(FileSerializer(file_instance).data, status=status.HTTP_200_OK)

        file_instance.status = 'pending'
        file_instance.admin_note = ''
        file_instance.reviewed_by = None
        file_instance.reviewed_at = None
        file_instance.save(update_fields=['status', 'admin_note', 'reviewed_by', 'reviewed_at', 'updated_at'])

        admins = CustomUser.objects.filter(role='admin', is_active=True)
        for admin in admins:
            create_notification(
                user=admin,
                title='File Submitted For Review',
                message=f'{file_instance.user.email} sent "{file_instance.original_name}" for review.',
                notification_type='file'
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

        notify_file_share_update(
            file_instance=file_instance,
            actor=request.user,
            action='shared',
            target_users=users,
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

    @action(detail=False, methods=['get'])
    def share_targets(self, request):
        users = CustomUser.objects.filter(
            is_active=True,
            is_approved=True,
        ).exclude(
            id=request.user.id
        ).order_by('role', 'first_name', 'email')

        data = [
            {
                'id': user.id,
                'email': user.email,
                'name': (
                    f"{user.first_name} {user.last_name}".strip()
                    or user.username
                    or user.email
                ),
                'role': user.role,
                'designation': user.designation,
            }
            for user in users
        ]

        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unshare_file(self, request, pk=None):

        file_instance = self.get_object()

        user_ids = request.data.get('user_ids', [])

        users = CustomUser.objects.filter(
            id__in=user_ids
        )

        target_users = list(users)

        file_instance.shared_with.remove(*users)

        if not file_instance.shared_with.exists():
            file_instance.shared = False
            file_instance.save()

            create_activity(
                request.user,
                'unshare_file',
                f'Unshared file {file_instance.original_name}'
            )

        notify_file_share_update(
            file_instance=file_instance,
            actor=request.user,
            action='unshared',
            target_users=target_users,
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

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        file_instance = self.get_object()

        storage_key = (getattr(file_instance, 'cloudinary_id', '') or '').strip()
        if not storage_key:
            return Response({'detail': 'File storage location is missing.'}, status=404)

        if not default_storage.exists(storage_key):
            return Response({'detail': 'Stored file not found.'}, status=404)

        opened = default_storage.open(storage_key, 'rb')
        response = FileResponse(
            opened,
            as_attachment=True,
            filename=file_instance.original_name or file_instance.file_name or 'download',
        )
        mime_type = getattr(file_instance, 'mime_type', '') or 'application/octet-stream'
        response['Content-Type'] = mime_type
        return response