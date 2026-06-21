from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .services import (
    get_admin_dashboard_data,
    get_employee_dashboard_data,
)


class AdminDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            get_admin_dashboard_data()
        )


class EmployeeDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            get_employee_dashboard_data(
                request.user
            )
        )