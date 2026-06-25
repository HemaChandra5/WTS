from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from accounts.views import UserViewSet, AdminViewSet
from activity_logs.views import ActivityLogViewSet
from files.views import FileViewSet
from notifications.views import NotificationViewSet
from tasks.views import TaskViewSet

router = DefaultRouter()

# Authentication
router.register(r'user', UserViewSet, basename='user')
router.register(r'admin-auth', AdminViewSet, basename='admin-auth')

# Files
router.register(r'files', FileViewSet, basename='file')

# Tasks
router.register(r'tasks', TaskViewSet, basename='task')

# Notifications
router.register(r'notifications', NotificationViewSet, basename='notification')

# Activity logs
router.register(r'activity', ActivityLogViewSet, basename='activity_log')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/dashboard/', include('dashboard.urls')),
]