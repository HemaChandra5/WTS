from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from accounts.models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'name',
            'role', 'department', 'profile_picture',
            'is_active', 'is_approved', 'is_rejected',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=6,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'password2', 'department']

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if CustomUser.objects.filter(email=normalized_email).exists():
            raise serializers.ValidationError("Email already exists.")
        if not normalized_email.endswith('@sskatt.com'):
            raise serializers.ValidationError("Only company emails (@sskatt.com) are allowed.")
        return normalized_email

    def validate(self, attrs):
        password2 = attrs.pop('password2', None)
        if attrs['password'] != password2:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return attrs

    def create(self, validated_data):
        # New employees are immediately active and approved (can login right after signup)
        user = CustomUser.objects.create_user(  # type: ignore[call-arg]
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
            role='employee',
            department=validated_data.get('department', 'General'),
            is_active=False,
            is_approved=False,
        )
        return user


class AdminRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=6,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'password2', 'department']

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if CustomUser.objects.filter(email=normalized_email).exists():
            raise serializers.ValidationError("Email already exists.")
        if not normalized_email.endswith('@sskatt.com'):
            raise serializers.ValidationError("Only company emails (@sskatt.com) are allowed.")
        return normalized_email

    def validate(self, attrs):
        password2 = attrs.pop('password2', None)
        if attrs['password'] != password2:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return attrs

    def create(self, validated_data):
        # Admins are immediately active and approved
        user = CustomUser.objects.create_user(  # type: ignore[call-arg]
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
            role='admin',
            department=validated_data.get('department', 'General'),
            is_staff=True,
            is_superuser=True,
            is_active=True,
            is_approved=True,
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)