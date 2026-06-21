from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
 
from accounts.views import UserViewSet, AdminViewSet
from files.views import FileViewSet
from tasks.views import TaskViewSet
 
router = DefaultRouter()
 
# Authentication
router.register(r'user', UserViewSet, basename='user')
router.register(r'admin-auth', AdminViewSet, basename='admin-auth')
 
# Files
router.register(r'files', FileViewSet, basename='file')
 
# Tasks
router.register(r'tasks', TaskViewSet, basename='task')
 
urlpatterns = [
    path('admin/', admin.site.urls),
 
    path('api/', include(router.urls)),

    path('api/dashboard/', include('dashboard.urls')),

    path(
    'api/notifications/',
    include('notifications.urls')),

    path(
    'api/tasks/',
    include('tasks.urls')),

    path(
    'api/files/',
    include('files.urls')),

    path(
    'api/activity/',
    include('activity_logs.urls')),
]