from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAdminUser
)
from django.contrib.auth import authenticate

from accounts.models import CustomUser
from accounts.serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    AdminRegistrationSerializer,
    UserLoginSerializer
)
from accounts.utils import create_jwt_token


# ─────────────────────────────────────────────────────────────
# USER VIEWSET
# ─────────────────────────────────────────────────────────────

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
        permission_classes=[AllowAny]
    )
    def register(self, request):

        print("REGISTER REQUEST DATA:")
        print(request.data)

        serializer = UserRegistrationSerializer(
            data=request.data
        )

        if serializer.is_valid():

            user = serializer.save()

            print("USER CREATED SUCCESSFULLY")
            print(user.email)

            return Response(
                {
                    'message': (
                        'Registration successful! '
                        'You can now login.'
                    ),
                    'status': 'success',
                    'user': UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )

        print("SERIALIZER ERRORS:")
        print(serializer.errors)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ─────────────────────────────────────────
    # USER LOGIN
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny]
    )
    def login(self, request):

        serializer = UserLoginSerializer(
            data=request.data
        )

        if serializer.is_valid():

            try:
                user_obj = CustomUser.objects.get(email=serializer.validated_data['email'])
            except CustomUser.DoesNotExist:  # type: ignore
                return Response(
                    {'message': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            except CustomUser.DoesNotExist:

                return Response(
                    {
                        'message': 'Invalid credentials'
                    },
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
                        'message': 'Login successful',
                        'token': token,
                        'user': UserSerializer(user).data,
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {
                    'message': 'Invalid credentials'
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ─────────────────────────────────────────
    # CURRENT USER
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated]
    )
    def me(self, request):

        return Response(
            UserSerializer(request.user).data
        )

    # ─────────────────────────────────────────
    # APPROVE USER
    # ─────────────────────────────────────────

    @action(
        detail=True,
        methods=['patch'],
        permission_classes=[IsAdminUser]
    )
    def approve_user(self, request, pk=None):

        user = self.get_object()

        user.is_approved = True
        user.is_active = True
        user.is_rejected = False
        user.save()

        return Response(
            {
                'message': (
                    f'User {user.username} approved'
                ),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Admin: reject a pending user ─────────────────────────────────────────
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def reject_user(self, request, pk=None):
        """Admin rejects a pending employee — sets is_rejected to True."""
        user = self.get_object()
        if user.role != 'employee':
            return Response(
                {'message': 'Only employee accounts can be rejected'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_approved = False
        user.is_active = False
        user.is_rejected = True
        user.save()
        return Response(
            {
                'message': f'User {user.username} ({user.email}) registration has been declined.',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Admin: deactivate a user ─────────────────────────────────────────────
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def deactivate_user(self, request, pk=None):

        user = self.get_object()

        user.is_active = False
        user.is_approved = False

        user.save()

        return Response(
            {
                'message': (
                    f'User {user.username} deactivated'
                )
            },
            status=status.HTTP_200_OK,
        )

    # ─────────────────────────────────────────
    # ACTIVATE USER
    # ─────────────────────────────────────────

    @action(
        detail=True,
        methods=['patch'],
        permission_classes=[IsAdminUser]
    )
    def activate_user(self, request, pk=None):

        user = self.get_object()

        user.is_active = True
        user.is_approved = True

        user.save()

        return Response(
            {
                'message': (
                    f'User {user.username} activated'
                )
            },
            status=status.HTTP_200_OK,
        )

    # ─────────────────────────────────────────
    # DELETE USER
    # ─────────────────────────────────────────

    @action(
        detail=True,
        methods=['delete'],
        permission_classes=[IsAdminUser]
    )
    def delete_user(self, request, pk=None):

        user = self.get_object()

        user.delete()

        return Response(
            {
                'message': 'User deleted successfully'
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────
# ADMIN VIEWSET
# ─────────────────────────────────────────────────────────────

class AdminViewSet(viewsets.ModelViewSet):

    queryset = CustomUser.objects.filter(
        role='admin'
    )

    serializer_class = UserSerializer

    permission_classes = [IsAdminUser]

    # ─────────────────────────────────────────
    # REGISTER ADMIN
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[IsAdminUser]
    )
    def register_admin(self, request):

        serializer = AdminRegistrationSerializer(
            data=request.data
        )

        if serializer.is_valid():

            user = serializer.save()

            token = create_jwt_token(user)

            return Response(
                {
                    'message': (
                        'Admin registered successfully'
                    ),
                    'token': token,
                    'admin': UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ─────────────────────────────────────────
    # ADMIN LOGIN
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny]
    )
    def admin_login(self, request):

        serializer = UserLoginSerializer(
            data=request.data
        )

        if serializer.is_valid():

            try:

                user_obj = CustomUser.objects.get(
                    email=serializer.validated_data['email'],
                    role='admin'
                )
            except CustomUser.DoesNotExist:  # type: ignore
                return Response(
                    {
                        'message':
                        'Invalid admin credentials'
                    },
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
                        'message':
                        'Admin login successful',
                        'token': token,
                        'admin':
                        UserSerializer(user).data,
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {
                    'message':
                    'Invalid admin credentials'
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ─────────────────────────────────────────
    # ALL USERS
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAdminUser]
    )
    def all_users(self, request):

        users = CustomUser.objects.filter(
            role='employee'
        ).order_by('-created_at')

        serializer = UserSerializer(
            users,
            many=True
        )

        return Response(serializer.data)

    # ─────────────────────────────────────────
    # PENDING USERS
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAdminUser]
    )
    def pending_users(self, request):
        """Return employees awaiting admin approval."""
        users = CustomUser.objects.filter(role='employee', is_approved=False, is_rejected=False).order_by('-created_at')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    # ─────────────────────────────────────────
    # ALL ADMINS
    # ─────────────────────────────────────────

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAdminUser]
    )
    def all_admins(self, request):

        admins = CustomUser.objects.filter(
            role='admin'
        )

        serializer = UserSerializer(
            admins,
            many=True
        )

        return Response(serializer.data)

    # ─────────────────────────────────────────
    # DELETE ADMIN
    # ─────────────────────────────────────────

    @action(
        detail=True,
        methods=['delete'],
        permission_classes=[IsAdminUser]
    )
    def delete_admin(self, request, pk=None):

        admin = self.get_object()

        if admin == request.user:

            return Response(
                {
                    'message':
                    'Cannot delete your own account'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin.delete()

        return Response(
            {
                'message':
                'Admin deleted successfully'
            },
            status=status.HTTP_200_OK,
        )