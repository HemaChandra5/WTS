from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAdminUser,
)

from django.contrib.auth import authenticate

from accounts.models import CustomUser
from accounts.serializers import (
    AdminRegistrationSerializer,
    UserLoginSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)
from accounts.utils import create_jwt_token
from activity_logs.services import create_activity
from notifications.services import create_notification


# ─────────────────────────────────────────────
# USER VIEWSET
# ─────────────────────────────────────────────


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomUser.objects.filter(role='employee')

    # ─────────────────────────────────────────
    # REGISTER EMPLOYEE
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
    )
    def register(self, request):
        admins = CustomUser.objects.filter(role='admin')

        print("REGISTER REQUEST DATA:")
        print(request.data)

        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            try:
                user = serializer.save()
                create_activity(user, 'register', 'Employee registered')

                for admin in admins:
                    create_notification(
                        user=admin,
                        title='New Employee Registration',
                        message=f'{user.email} has requested access.',
                        notification_type='approval',
                    )

                print("USER CREATED SUCCESSFULLY")
                print(user.email)

                return Response(
                    {
                        'message': 'Registration successful',
                        'status': 'success',
                        'user': UserSerializer(user).data,
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                print("SAVE ERROR:")
                print(str(e))

                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        print("SERIALIZER ERRORS:")
        print(serializer.errors)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ─────────────────────────────────────────
    # USER LOGIN
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
    )
    def login(self, request):
        serializer = UserLoginSerializer(data=request.data)

        if serializer.is_valid():
            try:
                user_obj = CustomUser.objects.get(
                    email=serializer.validated_data['email']
                )
            except CustomUser.DoesNotExist:
                return Response(
                    {'message': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # pending approval
            if user_obj.is_rejected:
                return Response(
                    {'message': 'Your account has been rejected by admin.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not user_obj.is_approved:
                return Response(
                    {'message': 'Account pending admin approval'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            user = authenticate(
                username=user_obj.username,
                password=serializer.validated_data['password'],
            )

            if user and user.is_active:
                token = create_jwt_token(user)

                return Response(
                    {
                        'message': 'Login successful',
                        'token': token,
                        'user': UserSerializer(user).data,
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {'message': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ─────────────────────────────────────────
    # CURRENT USER
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated],
    )
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    # ─────────────────────────────────────────
    # APPROVE USER
    # ─────────────────────────────────────────

    @action(
        detail=True,
        methods=['patch'],
        permission_classes=[IsAdminUser],
    )
    def approve_user(self, request, pk=None):
        user = self.get_object()

        user.is_approved = True
        user.is_active = True
        user.save()

        create_activity(request.user, 'approve_user', f'Approved {user.email}')

        create_notification(
            user=user,
            title='Account Approved',
            message='Your account has been approved by the administrator.',
            notification_type='approval',
        )
        return Response(
            {
                'message': f'User {user.username} approved',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    # ─────────────────────────────────────────
    # DEACTIVATE USER
    # ─────────────────────────────────────────

    @action(
        detail=True,
        methods=['patch'],
        permission_classes=[IsAdminUser],
    )
    def reject_user(self, request, pk=None):
        user = self.get_object()

        user.is_rejected = True
        user.is_approved = False
        user.is_active = False
        user.save()

        create_activity(
            request.user,
            'reject_user',
            f'Rejected {user.email}',
        )

        create_notification(
            user=user,
            title='Account Rejected',
            message='Your registration request has been rejected by the administrator.',
            notification_type='approval',
        )

        return Response(
            {
                'message': f'User {user.username} rejected',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=['patch'],
        permission_classes=[IsAdminUser],
    )
    def deactivate_user(self, request, pk=None):
        user = self.get_object()

        user.is_active = False

        # Keep the user approved so deactivated employees remain in the deactivated list,
        # not in the pending approvals list.
        user.save()

        create_activity(
            request.user,
            'deactivate_user',
            f'Deactivated {user.email}',
        )

        return Response(
            {'message': f'User {user.username} deactivated'},
            status=status.HTTP_200_OK,
        )

    # ─────────────────────────────────────────
    # ACTIVATE USER
    # ─────────────────────────────────────────

    @action(
        detail=True,
        methods=['patch'],
        permission_classes=[IsAdminUser],
    )
    def activate_user(self, request, pk=None):
        user = self.get_object()

        user.is_active = True
        user.is_approved = True
        user.save()

        create_activity(
            request.user,
            'activate_user',
            f'Activated {user.email}',
        )

        return Response(
            {'message': f'User {user.username} activated'},
            status=status.HTTP_200_OK,
        )

    # ─────────────────────────────────────────
    # DELETE USER
    # ─────────────────────────────────────────

    @action(
        detail=True,
        methods=['delete'],
        permission_classes=[IsAdminUser],
    )
    def delete_user(self, request, pk=None):
        user = self.get_object()

        user.delete()

        create_activity(
            request.user,
            'delete_user',
            f'Deleted {user.email}',
        )

        return Response(
            {'message': 'User deleted successfully'},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────
# ADMIN VIEWSET
# ─────────────────────────────────────────────


class AdminViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(role='admin')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    # ─────────────────────────────────────────
    # REGISTER ADMIN
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[IsAdminUser],
    )
    def register_admin(self, request):
        serializer = AdminRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            create_activity(
                request.user,
                'create_admin',
                f'Created admin {user.email}',
            )

            token = create_jwt_token(user)

            return Response(
                {
                    'message': 'Admin registered successfully',
                    'token': token,
                    'admin': UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ─────────────────────────────────────────
    # ADMIN LOGIN
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
    )
    def admin_login(self, request):
        serializer = UserLoginSerializer(data=request.data)

        if serializer.is_valid():
            try:
                user_obj = CustomUser.objects.get(
                    email=serializer.validated_data['email'],
                    role='admin',
                )
            except CustomUser.DoesNotExist:
                return Response(
                    {'message': 'Invalid admin credentials'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            user = authenticate(
                username=user_obj.username,
                password=serializer.validated_data['password'],
            )

            if user and user.is_active:
                token = create_jwt_token(user)

                return Response(
                    {
                        'message': 'Admin login successful',
                        'token': token,
                        'admin': UserSerializer(user).data,
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {'message': 'Invalid admin credentials'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ─────────────────────────────────────────
    # ALL USERS
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAdminUser],
    )
    def all_users(self, request):
        users = CustomUser.objects.filter(role='employee').order_by('-created_at')

        serializer = UserSerializer(users, many=True)

        return Response(serializer.data)

    # ─────────────────────────────────────────
    # PENDING USERS
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAdminUser],
    )
    def pending_users(self, request):
        users = CustomUser.objects.filter(
            role='employee',
            is_approved=False,
        ).order_by('-created_at')

        serializer = UserSerializer(users, many=True)

        return Response(serializer.data)

    # ─────────────────────────────────────────
    # ALL ADMINS
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAdminUser],
    )
    def all_admins(self, request):
        admins = CustomUser.objects.filter(role='admin')

        serializer = UserSerializer(admins, many=True)

        return Response(serializer.data)

    # ─────────────────────────────────────────
    # DELETE ADMIN
    # ─────────────────────────────────────────

    @action(
        detail=True,
        methods=['delete'],
        permission_classes=[IsAdminUser],
    )
    def delete_admin(self, request, pk=None):
        admin = self.get_object()

        if admin == request.user:
            return Response(
                {'message': 'Cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin.delete()

        create_activity(
            request.user,
            'delete_admin',
            f'Deleted admin {admin.email}',
        )

        return Response(
            {'message': 'Admin deleted successfully'},
            status=status.HTTP_200_OK,
        )