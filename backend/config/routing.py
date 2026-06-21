from django.urls import re_path
from files.consumers import FileConsumer
from tasks.consumers import TaskConsumer
from notifications.consumers import NotificationConsumer

websocket_urlpatterns = [
    re_path(r"ws/files/$", FileConsumer.as_asgi()),
    re_path(r"ws/tasks/$", TaskConsumer.as_asgi()),
    re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),
]