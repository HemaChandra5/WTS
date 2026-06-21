import json
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope['user']

        if not user.is_authenticated:
            await self.close()
            return

        self.group_name = f'notifications_{user.id}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

        print(
            f'✅ Notification socket connected: {user.email}'
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

        print(
            f'❌ Notification socket disconnected: {self.group_name}'
        )

    async def notification_message(self, event):
        print(
            'Sending websocket notification:',
            event
        )

        await self.send(
            text_data=json.dumps(
                event['notification']
            )
        )
