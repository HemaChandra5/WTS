from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import ActivityLog
from .serializers import ActivityLogSerializer
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend


class ActivityLogViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        DjangoFilterBackend,
    ]

    search_fields = [
        'user__email',
        'description',
        'action',
    ]

    filterset_fields = [
        'action',
    ]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return ActivityLog.objects.select_related(
                'user'
            ).all()

        return ActivityLog.objects.select_related(
            'user'
        ).filter(
            user=user
        )