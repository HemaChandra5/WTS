from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import ActivityLog
from .pagination import ActivityLogPagination
from .serializers import ActivityLogSerializer
from rest_framework.filters import SearchFilter


class ActivityLogViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ActivityLogPagination

    filter_backends = [
        SearchFilter,
    ]

    search_fields = [
        'user__email',
        'description',
        'action',
    ]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            queryset = ActivityLog.objects.select_related(
                'user'
            ).all()
        else:
            queryset = ActivityLog.objects.select_related(
                'user'
            ).filter(
                user=user
            )

        action = (self.request.query_params.get('action') or '').strip()
        if action and action != 'all':
            action_values = [item.strip() for item in action.split(',') if item.strip()]
            if action_values:
                queryset = queryset.filter(action__in=action_values)

        date_range = (self.request.query_params.get('date_range') or '').strip().lower()
        now = timezone.now()
        if date_range == 'today':
            queryset = queryset.filter(created_at__date=now.date())
        elif date_range in {'7d', '30d', '90d'}:
            days = int(date_range.replace('d', ''))
            queryset = queryset.filter(created_at__gte=now - timedelta(days=days))

        start_date_param = self.request.query_params.get('start_date')
        end_date_param = self.request.query_params.get('end_date')

        start_date = parse_date(start_date_param) if start_date_param else None
        end_date = parse_date(end_date_param) if end_date_param else None

        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)

        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        return queryset