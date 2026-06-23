from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(
    serializers.ModelSerializer
):
    user_email = serializers.EmailField(
        source='user.email',
        read_only=True
    )
    user_name = serializers.SerializerMethodField()

    def get_user_name(self, obj):
        if not obj.user:
            return ''
        full_name = (obj.user.get_full_name() or '').strip()
        if full_name:
            return full_name
        return obj.user.username or obj.user.email or ''

    class Meta:
        model = ActivityLog

        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'action',
            'description',
            'created_at',
        ]