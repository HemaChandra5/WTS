from .models import ActivityLog


def create_activity(
    user,
    action,
    description
):
    return ActivityLog.objects.create(
        user=user,
        action=action,
        description=description
    )