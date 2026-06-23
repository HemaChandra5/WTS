# files/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.utils.text import slugify

from files.models import File


class FileConsumer(AsyncWebsocketConsumer):
    ADMIN_GROUP = "files_admin"

    async def connect(self):
        if not self.scope['user'].is_authenticated:
            await self.close()
            return

        self.user_email = self.scope['user'].email
        self.user_slug = slugify(self.user_email)
        self.user_group = f'files_{self.user_slug}'
        self.is_admin = getattr(self.scope['user'], 'role', None) == 'admin'

        await self.channel_layer.group_add(self.user_group, self.channel_name)

        if self.is_admin:
            await self.channel_layer.group_add(self.ADMIN_GROUP, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.user_group, self.channel_name)

        if getattr(self, 'is_admin', False):
            await self.channel_layer.group_discard(self.ADMIN_GROUP, self.channel_name)

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
                files = await self.get_visible_files()
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
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "error",
                            "message": "Client-triggered file broadcast is not allowed.",
                        }
                    )
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

    async def file_share_update(self, event):
        """Broadcast file share/unshare update"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "file_share_update",
                    "action": event.get("action"),
                    "actorEmail": event.get("actorEmail", ""),
                    "file": event.get("file"),
                    "targetUserIds": event.get("targetUserIds", []),
                }
            )
        )

    # ------------------------------------------------------------------
    # DB helpers
    # ------------------------------------------------------------------
    @sync_to_async
    def get_visible_files(self):
        """
        Returns files in the shape your frontend expects:
        id, originalName, size, status, userName, userEmail, createdAt, description
        """
        qs = File.objects.select_related("user").order_by("-created_at")

        if not self.is_admin:
            qs = qs.filter(user=self.scope['user'])

        result = []
        for f in qs:
            result.append(
                {
                    "id": str(f.id),
                    "originalName": f.original_name,
                    "size": getattr(f, "size", None),
                    "status": getattr(f, "status", None),
                    "userName": getattr(f.user, "first_name", "") if getattr(f, "user", None) else "",
                    "userEmail": getattr(f.user, "email", "") if getattr(f, "user", None) else "",
                    "createdAt": f.created_at.isoformat() if getattr(f, "created_at", None) else None,
                    "updatedAt": f.updated_at.isoformat() if getattr(f, "updated_at", None) else None,
                    "description": getattr(f, "description", ""),
                    "url": getattr(f, "url", ""),
                    "mimeType": getattr(f, "mime_type", ""),
                    "fileName": getattr(f, "file_name", ""),
                    "cloudinaryId": getattr(f, "cloudinary_id", ""),
                    "shared": getattr(f, "shared", False),
                }
            )
        return result