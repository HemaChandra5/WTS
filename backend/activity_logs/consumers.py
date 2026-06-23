import json

from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils.text import slugify


class ActivityConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return

        user_email = getattr(user, 'email', '') or 'anonymous'
        self.user_group = f'activity_{slugify(user_email)}'
        self.is_admin = getattr(user, 'role', None) == 'admin'

        await self.channel_layer.group_add(self.user_group, self.channel_name)
        if self.is_admin:
            await self.channel_layer.group_add('activity_admin', self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.user_group, self.channel_name)
        if getattr(self, 'is_admin', False):
            await self.channel_layer.group_discard('activity_admin', self.channel_name)

    async def activity_event(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    'type': 'activity_event',
                    'activity': event.get('activity'),
                }
            )
        )
