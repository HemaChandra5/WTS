from django.db import models
from django.contrib.auth.models import AbstractUser


DEPARTMENT_CHOICES = (
    ('Python Developer', 'Python Developer'),
    ('Data Analyst', 'Data Analyst'),
    ('Testing', 'Testing'),
    ('Research', 'Research'),
    ('Digital Marketing', 'Digital Marketing'),
    ('DevOps', 'DevOps'),
    ('HR', 'HR'),
    ('Cyber Security', 'Cyber Security'),
    ('Engineering', 'Engineering'),
)

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('employee', 'Employee'),
        ('admin', 'Admin'),
    )
    
    email = models.EmailField(unique=True)
    employee_id = models.CharField(
    max_length=20,
    unique=True,
    null=True,
    blank=True
)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    department = models.CharField(
    max_length=100,
    choices=DEPARTMENT_CHOICES,
    default='Engineering'
)
    phone_number = models.CharField(
    max_length=15,
    blank=True
)
    designation = models.CharField(
    max_length=100,
    blank=True
)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)             
    is_active = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    is_rejected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_customuser'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} ({self.role})"
    
    def is_employee(self):
        return self.role == 'employee'
    
    def is_admin_user(self):
        return self.role == 'admin'