from accounts.models import CustomUser
from tasks.models import Task
from files.models import File


def get_admin_dashboard_data():
    return {
        "employees": CustomUser.objects.filter(
            role="employee"
        ).count(),

        "activeEmployees": CustomUser.objects.filter(
            role="employee",
            is_active=True
        ).count(),

        "inactiveEmployees": CustomUser.objects.filter(
            role="employee",
            is_active=False,
            is_approved=True
        ).count(),

        "pendingApprovals": CustomUser.objects.filter(
            role="employee",
            is_approved=False,
            is_rejected=False
        ).count(),

        "rejectedEmployees": CustomUser.objects.filter(
            role="employee",
            is_rejected=True
        ).count(),

        "tasks": Task.objects.count(),

        "completedTasks": Task.objects.filter(
            status="done"
        ).count(),

        "pendingTasks": Task.objects.exclude(
            status="done"
        ).count(),

        "files": File.objects.count(),

        "approvedFiles": File.objects.filter(
            status="approved"
        ).count(),

        "rejectedFiles": File.objects.filter(
            status="rejected"
        ).count(),

        "pendingFiles": File.objects.filter(
            status="pending"
        ).count(),
    }


def get_employee_dashboard_data(user):
    return {
        "myTasks": Task.objects.filter(
            assigned_to_user=user
        ).count(),

        "completedTasks": Task.objects.filter(
            assigned_to_user=user,
            status="done"
        ).count(),

        "pendingTasks": Task.objects.filter(
            assigned_to_user=user
        ).exclude(
            status="done"
        ).count(),

        "myFiles": File.objects.filter(
            user=user
        ).count(),

        "approvedFiles": File.objects.filter(
            user=user,
            status="approved"
        ).count(),

        "rejectedFiles": File.objects.filter(
            user=user,
            status="rejected"
        ).count(),

        "pendingReviews": File.objects.filter(
            user=user,
            status="pending"
        ).count(),
    }