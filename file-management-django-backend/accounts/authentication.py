import jwt
from urllib.parse import parse_qs
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from channels.db import database_sync_to_async
from accounts.models import CustomUser


class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header[7:]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user = CustomUser.objects.get(id=payload['id'])

            # Deny access if admin has not approved the account yet
            if not user.is_approved:
                raise AuthenticationFailed('Account not yet approved by admin.')

            # Deny access if account was deactivated after approval
            if not user.is_active:
                raise AuthenticationFailed('Account has been deactivated.')

            return (user, token)
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, CustomUser.DoesNotExist):
            raise AuthenticationFailed('Invalid or expired token')


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope):
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token_list = query_params.get('token') or query_params.get('authorization')
        token = token_list[0] if token_list else None

        scope['user'] = AnonymousUser()

        if token:
            user = await self.get_user_from_token(token)
            if user is not None:
                scope['user'] = user

        return await self.inner(scope)

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user = CustomUser.objects.get(id=payload['id'])
            if not user.is_approved or not user.is_active:
                return None
            return user
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, CustomUser.DoesNotExist):
            return None