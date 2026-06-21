from django.urls import path
from .views import (
    AdminDashboardAPIView,
    EmployeeDashboardAPIView,
)

urlpatterns = [
    path(
        "admin/",
        AdminDashboardAPIView.as_view()
    ),

    path(
        "employee/",
        EmployeeDashboardAPIView.as_view()
    ),
]