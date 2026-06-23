from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils.text import slugify

from .models import ActivityLog
from .serializers import ActivityLogSerializer


def create_activity(
    user,
    action,
    description
):
    activity = ActivityLog.objects.create(
        user=user,
        action=action,
        description=description
    )

    channel_layer = get_channel_layer()
    if channel_layer is None:
        return activity

    payload = ActivityLogSerializer(activity).data
    user_email = getattr(user, 'email', '') or 'anonymous'
    user_group = f'activity_{slugify(user_email)}'

    async_to_sync(channel_layer.group_send)(
        user_group,
        {
            'type': 'activity_event',
            'activity': payload,
        },
    )

    if getattr(user, 'role', None) != 'admin':
        async_to_sync(channel_layer.group_send)(
            'activity_admin',
            {
                'type': 'activity_event',
                'activity': payload,
            },
        )

    return activity