# files/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.utils.text import slugify

from files.models import File


class FileConsumer(AsyncWebsocketConsumer):
    GROUP_NAME = "files_group"
    ADMIN_GROUP = "files_admin"

    async def connect(self):
        self.user_email = self.scope['user'].email if self.scope['user'].is_authenticated else None
        self.user_slug = slugify(self.user_email) if self.user_email else 'anonymous'
        self.user_group = f'files_{self.user_slug}'

        await self.channel_layer.group_add(self.GROUP_NAME, self.channel_name)
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        if self.scope['user'].is_authenticated and getattr(self.scope['user'], 'role', None) == 'admin':
            await self.channel_layer.group_add(self.ADMIN_GROUP, self.channel_name)

        await self.accept()
        print(f"✅ Client connected to files WebSocket ({self.user_group})")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.GROUP_NAME, self.channel_name)
        await self.channel_layer.group_discard(self.user_group, self.channel_name)

        if self.scope['user'].is_authenticated and getattr(self.scope['user'], 'role', None) == 'admin':
            await self.channel_layer.group_discard(self.ADMIN_GROUP, self.channel_name)

        print(f"❌ Client disconnected from files WebSocket ({self.user_group})")

    async def receive(self, text_data=None, bytes_data=None):
        """
        Client -> Server messages (optional)
        """
        if not text_data:
            return

        try:
            data = json.loads(text_data)
            action = data.get("action")

            if action == "get_files":
                files = await self.get_all_files()
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "file_list",
                            "files": files,
                        }
                    )
                )
                return

            if action == "file_uploaded":
                # Optional: client-triggered broadcast (usually you broadcast from views.py)
                await self.channel_layer.group_send(
                    self.GROUP_NAME,
                    {
                        "type": "file_notification",  # calls self.file_notification
                        "message": f"New file uploaded: {data.get('fileName')}",
                        "file": data,
                    },
                )
                return

            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": f"Unknown action: {action}"}
                )
            )

        except Exception as e:
            await self.send(text_data=json.dumps({"type": "error", "message": str(e)}))

    # ------------------------------------------------------------------
    # ✅ Recommended generic event handler (works with views.py helper):
    # group_send(..., {"type": "files.event", "payload": {...}})
    # Channels maps "files.event" -> files_event method
    # ------------------------------------------------------------------
    async def files_event(self, event):
        """
        Server -> Client generic event.
        Expects: event["payload"] to be JSON-serializable.
        """
        payload = event.get("payload", {})
        await self.send(text_data=json.dumps(payload))

    # ------------------------------------------------------------------
    # Backward-compatible handlers (your current style)
    # ------------------------------------------------------------------
    async def file_notification(self, event):
        """Broadcast file notification to all connected clients"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "file_notification",
                    "message": event.get("message", ""),
                    "file": event.get("file"),
                }
            )
        )

    async def file_status_update(self, event):
        """Broadcast file status update"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "file_status_update",
                    "fileId": event.get("fileId"),
                    "status": event.get("status"),
                    "adminNote": event.get("adminNote", "") or "",
                }
            )
        )

    # ------------------------------------------------------------------
    # DB helpers
    # ------------------------------------------------------------------
    @sync_to_async
    def get_all_files(self):
        """
        Returns files in the shape your frontend expects:
        id, originalName, size, status, userName, userEmail, createdAt, description
        """
        qs = (
            File.objects.select_related("user")
            .all()
            .order_by("-createdAt")
        )

        result = []
        for f in qs:
            result.append(
                {
                    "id": str(f.id),
                    "originalName": getattr(f, "originalName", None),
                    "size": getattr(f, "size", None),
                    "status": getattr(f, "status", None),
                    "userName": getattr(f.user, "first_name", "") if getattr(f, "user", None) else "",
                    "userEmail": getattr(f.user, "email", "") if getattr(f, "user", None) else "",
                    "createdAt": f.createdAt.isoformat() if getattr(f, "createdAt", None) else None,
                    "description": getattr(f, "description", ""),
                }
            )
        return result