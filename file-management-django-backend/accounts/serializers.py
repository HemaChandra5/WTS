from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from accounts.models import CustomUser
 
 
# ─────────────────────────────────────────────
# USER SERIALIZER
# ─────────────────────────────────────────────
 
class UserSerializer(serializers.ModelSerializer):
 
    class Meta:
 
        model = CustomUser
 
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'department',
            'profile_picture',
            'is_active',
            'is_approved',
            'created_at',
            'updated_at',
        ]
 
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]
 
 
# ─────────────────────────────────────────────
# EMPLOYEE REGISTRATION SERIALIZER
# ─────────────────────────────────────────────
 
class UserRegistrationSerializer(
    serializers.ModelSerializer
):
 
    password2 = serializers.CharField(
        write_only=True
    )
 
    class Meta:
 
        model = CustomUser
 
        fields = [
            'email',
            'username',
            'first_name',
            'last_name',
            'password',
            'password2',
            'department',
        ]
 
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }
 
    # ─────────────────────────────────────────
    # VALIDATE EMAIL
    # ─────────────────────────────────────────
 
    def validate_email(self, value):
 
        value = value.lower().strip()
 
        if CustomUser.objects.filter(
            email=value
        ).exists():
 
            raise serializers.ValidationError(
                'Email already exists'
            )
 
        if not value.endswith('@sskatt.com'):
 
            raise serializers.ValidationError(
                'Only company emails (@sskatt.com) are allowed'
            )
 
        return value
 
    # ─────────────────────────────────────────
    # VALIDATE USERNAME
    # ─────────────────────────────────────────
 
    def validate_username(self, value):
 
        if CustomUser.objects.filter(
            username=value
        ).exists():
 
            raise serializers.ValidationError(
                'Username already exists'
            )
 
        return value
 
    # ─────────────────────────────────────────
    # VALIDATE PASSWORDS
    # ─────────────────────────────────────────
 
    def validate(self, attrs):
 
        if attrs['password'] != attrs['password2']:
 
            raise serializers.ValidationError(
                {
                    'password':
                    'Passwords do not match'
                }
            )
 
        return attrs
 
    # ─────────────────────────────────────────
    # CREATE EMPLOYEE
    # ─────────────────────────────────────────
 
    def create(self, validated_data):
 
        validated_data.pop('password2')
 
        raw_password = validated_data.pop(
            'password'
        )
 
        user = CustomUser.objects.create(
 
            email=validated_data['email'],
 
            username=validated_data['username'],
 
            first_name=validated_data.get(
                'first_name',
                ''
            ),
 
            last_name=validated_data.get(
                'last_name',
                ''
            ),
 
            department=validated_data.get(
                'department',
                'General'
            ),
 
            role='employee',
 
            # pending admin approval
            is_active=False,
 
            is_approved=False,
        )
 
        # HASH PASSWORD
        user.password = make_password(
            raw_password
        )
 
        user.save()
 
        print("EMPLOYEE CREATED:")
        print(user.email)
 
        return user
 
 
# ─────────────────────────────────────────────
# ADMIN REGISTRATION SERIALIZER
# ─────────────────────────────────────────────
 
class AdminRegistrationSerializer(
    serializers.ModelSerializer
):
 
    password2 = serializers.CharField(
        write_only=True
    )
 
    class Meta:
 
        model = CustomUser
 
        fields = [
            'email',
            'username',
            'first_name',
            'last_name',
            'password',
            'password2',
            'department',
        ]
 
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }
 
    # ─────────────────────────────────────────
    # VALIDATE EMAIL
    # ─────────────────────────────────────────
 
    def validate_email(self, value):
 
        value = value.lower().strip()
 
        if CustomUser.objects.filter(
            email=value
        ).exists():
 
            raise serializers.ValidationError(
                'Email already exists'
            )
 
        if not value.endswith('@sskatt.com'):
 
            raise serializers.ValidationError(
                'Only company emails (@sskatt.com) are allowed'
            )
 
        return value
 
    # ─────────────────────────────────────────
    # VALIDATE USERNAME
    # ─────────────────────────────────────────
 
    def validate_username(self, value):
 
        if CustomUser.objects.filter(
            username=value
        ).exists():
 
            raise serializers.ValidationError(
                'Username already exists'
            )
 
        return value
 
    # ─────────────────────────────────────────
    # VALIDATE PASSWORDS
    # ─────────────────────────────────────────
 
    def validate(self, attrs):
 
        if attrs['password'] != attrs['password2']:
 
            raise serializers.ValidationError(
                {
                    'password':
                    'Passwords do not match'
                }
            )
 
        return attrs
 
    # ─────────────────────────────────────────
    # CREATE ADMIN
    # ─────────────────────────────────────────
 
    def create(self, validated_data):
 
        validated_data.pop('password2')
 
        raw_password = validated_data.pop(
            'password'
        )
 
        user = CustomUser.objects.create(
 
            email=validated_data['email'],
 
            username=validated_data['username'],
 
            first_name=validated_data.get(
                'first_name',
                ''
            ),
 
            last_name=validated_data.get(
                'last_name',
                ''
            ),
 
            department=validated_data.get(
                'department',
                'General'
            ),
 
            role='admin',
 
            is_staff=True,
 
            is_superuser=True,
 
            is_active=True,
 
            is_approved=True,
        )
 
        # HASH PASSWORD
        user.password = make_password(
            raw_password
        )
 
        user.save()
 
        print("ADMIN CREATED:")
        print(user.email)
 
        return user
 
 
# ─────────────────────────────────────────────
# LOGIN SERIALIZER
# ─────────────────────────────────────────────
 
class UserLoginSerializer(serializers.Serializer):
 
    email = serializers.EmailField()
 
    password = serializers.CharField(
        write_only=True
    )
 