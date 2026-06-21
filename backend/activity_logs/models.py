from django.db import models
from django.conf import settings


class ActivityLog(models.Model):
    ACTION_CHOICES = (
    ('login', 'Login'),
    ('register', 'Register'),
    ('approve_user', 'Approve User'),
    ('reject_user', 'Reject User'),
    ('create_task', 'Create Task'),
    ('update_task', 'Update Task'),
    ('delete_task', 'Delete Task'),
    ('upload_file', 'Upload File'),
    ('approve_file', 'Approve File'),
    ('reject_file', 'Reject File'),
    ('delete_file', 'Delete File'),
    ('share_file', 'Share File'),
    ('unshare_file', 'Unshare File'),
)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES
    )

    description = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['-created_at']

        indexes = [
        models.Index(fields=['user']),
        models.Index(fields=['action']),
        models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.user.email} - {self.action}'