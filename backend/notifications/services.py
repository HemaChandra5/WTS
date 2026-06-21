from .models import Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def create_notification(
    user,
    title,
    message,
    notification_type='system'
):
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type
    )

    channel_layer = get_channel_layer()

    print(
    f'Sending notification to notifications_{user.id}'
        )

    async_to_sync(
        channel_layer.group_send
    )(
        f'notifications_{user.id}',
        {
            'type': 'notification_message',
            'notification': {
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.notification_type,
                'time': notification.created_at.isoformat(),
                'isRead': notification.is_read,
            }
        }
    )

    return notification