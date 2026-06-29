from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import mimetypes
import os
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.text import slugify
from django.utils import timezone
from django.http import FileResponse
from django.core.files.storage import default_storage
from rest_framework.exceptions import ValidationError
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import Task
from .serializers import TaskSerializer
from notifications.services import create_notification
from activity_logs.services import create_activity
from accounts.models import CustomUser


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by("-created_at")
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        DjangoFilterBackend,
    ]

    search_fields = [
        'title',
        'description',
        'assigned_to_email',
        'assigned_to_user__username',
        'assigned_to_user__first_name',
        'assigned_to_user__last_name',
        'assigned_to_user__email',
    ]

    filterset_fields = [
        'status',
        'priority',
    ]

    def get_queryset(self):
        queryset = Task.objects.select_related('assigned_to_user', 'assigned_by_user')
        if self.request.user.role == 'admin':
            return queryset.order_by("-created_at")

        return queryset.filter(
            assigned_to_user=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        """Called after validation, before saving"""
        employee = CustomUser.objects.filter(
            email=self.request.data.get("assigned_to_email"),
            role='employee',
            is_active=True,
            is_approved=True,
            is_rejected=False,
        ).first()

        if not employee:
            raise ValidationError(
                "Assigned user must be an active approved employee"
            )

        uploaded_admin_file = self.request.FILES.get("admin_file")

        task = serializer.save(
            assigned_to_user=employee,
            assigned_by_user=self.request.user,
            admin_file_original_name=(getattr(uploaded_admin_file, 'name', '') or ''),
            admin_file_mime_type=(getattr(uploaded_admin_file, 'content_type', '') or ''),
        )

        if task.assigned_to_user:
            task.assigned_to_user.unread_task_count = (task.assigned_to_user.unread_task_count or 0) + 1
            task.assigned_to_user.save(update_fields=['unread_task_count'])

        create_activity(
            self.request.user,
            'create_task',
            f'Created task {task.title}'
        )

        if task.assigned_to_user:
            create_notification(
                user=task.assigned_to_user,
                title='New Task Assigned',
                message=f'You have been assigned "{task.title}".',
                notification_type='task'
            )

        if self.request.user.role != 'admin':
            admins = CustomUser.objects.filter(role='admin', is_active=True)
            for admin in admins:
                create_notification(
                    user=admin,
                    title='Task Created By Employee',
                    message=f'{self.request.user.email} created task "{task.title}".',
                    notification_type='task'
                )

        assigned_email = serializer.validated_data.get(
            "assigned_to_email"
        )
        assigned_slug = slugify(assigned_email)

        async_to_sync(get_channel_layer().group_send)(
            f'tasks_{assigned_slug}',
            {
                'type': 'task_notification',
                'message': f"New task: {serializer.validated_data['title']}",
                'task': {
                    'id': str(task.id),
                    'title': task.title,
                    'assignedToEmail': task.assigned_to_email,
                    'status': task.status,
                    'createdAt': task.created_at.isoformat()
                }
            }
        )

        async_to_sync(get_channel_layer().group_send)(
            'tasks_admin',
            {
                'type': 'task_notification',
                'message': f"Task created: {task.title}",
                'task': {
                    'id': str(task.id),
                    'title': task.title,
                    'description': task.description,
                    'assignedToEmail': task.assigned_to_email,
                    'status': task.status,
                    'priority': task.priority,
                    'createdAt': task.created_at.isoformat(),
                    'updatedAt': task.updated_at.isoformat(),
                }
            }
        )

    # ===== ADD THIS METHOD =====
    def perform_destroy(self, instance):
        create_activity(
            self.request.user,
            'delete_task',
            f'Deleted task "{instance.title}"'
        )

        instance.delete()

    @action(detail=True, methods=["patch"], url_path="update_status")
    def update_status(self, request, pk=None):
        """
        PATCH /tasks/{id}/update_status/
        Body: { "status": "done" }
        """
        task = self.get_object()
        new_status = request.data.get("status")

        if not new_status:
            return Response(
                {"detail": "status is required"},
                status=400
            )

        allowed_statuses = {'pending', 'in_progress', 'done'}
        if new_status not in allowed_statuses:
            return Response(
                {"detail": "Invalid status"},
                status=400
            )

        # Task progress should be updated by the assigned employee, not admin.
        if not task.assigned_to_user or str(task.assigned_to_user.id) != str(request.user.id):
            return Response(
                {"detail": "Only the assigned employee can update task status"},
                status=403
            )

        task.status = new_status

        if new_status == 'done':
            task.completed_at = timezone.now()
        else:
            task.completed_at = None

        task.save()

        create_activity(
            request.user,
            'update_task',
            f'Updated task "{task.title}" status to {task.status}'
        )

        assigned_slug = slugify(
            task.assigned_to_email
        )

        async_to_sync(get_channel_layer().group_send)(
            f'tasks_{assigned_slug}',
            {
                'type': 'task_status_update',
                'taskId': str(task.id),
                'status': task.status
            }
        )

        async_to_sync(get_channel_layer().group_send)(
            'tasks_admin',
            {
                'type': 'task_status_update',
                'taskId': str(task.id),
                'status': task.status,
                'updatedBy': request.user.email,
            }
        )

        admins = CustomUser.objects.filter(role='admin', is_active=True)
        for admin in admins:
            create_notification(
                user=admin,
                title='Task Status Updated',
                message=f'{request.user.email} updated "{task.title}" to {task.status.replace("_", " ")}.',
                notification_type='task'
            )

        return Response(
            TaskSerializer(task).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        tasks = self.get_queryset().filter(
            due_date__lt=timezone.now()
        ).exclude(
            status='done'
        )

        serializer = self.get_serializer(
            tasks,
            many=True
        )

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def due_today(self, request):
        today = timezone.now().date()

        tasks = self.get_queryset().filter(
            due_date__date=today
        )

        serializer = self.get_serializer(
            tasks,
            many=True
        )

        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='download_attachment')
    def download_attachment(self, request, pk=None):
        task = self.get_object()

        if not task.admin_file:
            return Response({'detail': 'This task has no attachment.'}, status=404)

        storage_key = (getattr(task.admin_file, 'name', '') or '').strip()
        if not storage_key:
            return Response({'detail': 'Attachment storage location is missing.'}, status=404)

        if not default_storage.exists(storage_key):
            return Response({'detail': 'Attachment file not found.'}, status=404)

        metadata_updates = []
        if not task.admin_file_original_name:
            task.admin_file_original_name = os.path.basename(storage_key) or 'task-attachment'
            metadata_updates.append('admin_file_original_name')

        if not task.admin_file_mime_type:
            task.admin_file_mime_type = mimetypes.guess_type(task.admin_file_original_name)[0] or ''
            metadata_updates.append('admin_file_mime_type')

        if metadata_updates:
            task.save(update_fields=metadata_updates)

        opened = default_storage.open(storage_key, 'rb')
        file_name = task.admin_file_original_name or os.path.basename(storage_key) or 'task-attachment'
        mime_type = task.admin_file_mime_type or mimetypes.guess_type(file_name)[0] or 'application/octet-stream'
        response = FileResponse(opened, as_attachment=True, filename=file_name)
        response['Content-Type'] = mime_type
        return response