from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient, force_authenticate

from accounts.models import CustomUser
from tasks.models import Task


class TaskUnreadCountTests(TestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            username='admin_user',
            email='admin@sskatt.com',
            password='adminpass123',
            role='admin',
            is_active=True,
            is_approved=True,
            is_rejected=False,
        )
        self.employee = CustomUser.objects.create_user(
            username='employee_user',
            email='employee@sskatt.com',
            password='emppass123',
            role='employee',
            is_active=True,
            is_approved=True,
            is_rejected=False,
        )
        self.other_employee = CustomUser.objects.create_user(
            username='other_employee',
            email='other@sskatt.com',
            password='otherpass123',
            role='employee',
            is_active=True,
            is_approved=True,
            is_rejected=False,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_assigning_task_increments_employee_unread_count(self):
        response = self.client.post(
            reverse('task-list'),
            {
                'title': 'New task',
                'description': 'Please review this',
                'assigned_to_email': self.employee.email,
                'priority': 'high',
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 201)
        self.employee.refresh_from_db()
        self.assertEqual(self.employee.unread_task_count, 1)

    def test_task_search_matches_assigned_username(self):
        Task.objects.create(
            title='Design review',
            description='Needs feedback',
            assigned_to_email=self.employee.email,
            assigned_to_user=self.employee,
            assigned_by_user=self.admin,
            priority='medium',
            status='pending',
        )

        response = self.client.get(
            reverse('task-list'),
            {'search': self.employee.username},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Design review')

    def test_assigned_employee_can_download_task_attachment(self):
        task = Task.objects.create(
            title='With attachment',
            description='Please check the document',
            assigned_to_email=self.employee.email,
            assigned_to_user=self.employee,
            assigned_by_user=self.admin,
            admin_file=SimpleUploadedFile('instructions.txt', b'task attachment content', content_type='text/plain'),
            admin_file_original_name='instructions.txt',
            admin_file_mime_type='text/plain',
            priority='medium',
            status='pending',
        )

        self.client.force_authenticate(self.employee)
        response = self.client.get(reverse('task-download-attachment', kwargs={'pk': task.id}))

        self.assertEqual(response.status_code, 200)
        self.assertIn('attachment', response.get('Content-Disposition', '').lower())
        self.assertIn('instructions.txt', response.get('Content-Disposition', ''))
        self.assertEqual(response.get('Content-Type'), 'text/plain')

    def test_non_assigned_employee_cannot_download_task_attachment(self):
        task = Task.objects.create(
            title='Restricted attachment',
            description='Only assignee can access this',
            assigned_to_email=self.employee.email,
            assigned_to_user=self.employee,
            assigned_by_user=self.admin,
            admin_file=SimpleUploadedFile('secret.txt', b'secret content', content_type='text/plain'),
            admin_file_original_name='secret.txt',
            admin_file_mime_type='text/plain',
            priority='medium',
            status='pending',
        )

        self.client.force_authenticate(self.other_employee)
        response = self.client.get(reverse('task-download-attachment', kwargs={'pk': task.id}))

        self.assertEqual(response.status_code, 404)
