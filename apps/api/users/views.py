"""Views for user endpoints."""

from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from wireup import Injected
from wireup.integration.django import inject

from api.exceptions import ApiError
from api.rest import api_data, require_authenticated_user
from users.serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserAvatarUploadSerializer,
    UserProfileUpdateSerializer,
    UserPublicSerializer,
)
from users.services import UserService


class UsersController(APIView):
    """Controller for users endpoints."""

    @inject
    def get(self, request, service: Injected[UserService]):
        user = require_authenticated_user(request)
        return api_data(service.me(user))

    @inject
    def patch(self, request, service: Injected[UserService]):
        user = require_authenticated_user(request)
        serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = service.update_profile(user, serializer.validated_data)
        return api_data(UserPublicSerializer(updated_user).data)


class UserAvatarController(APIView):
    """Upload and attach the current user's profile avatar."""

    parser_classes = [MultiPartParser, FormParser]

    @inject
    def post(self, request, service: Injected[UserService]):
        user = require_authenticated_user(request)
        serializer = UserAvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_user = service.update_avatar(user, serializer.validated_data["avatar"])
        return api_data(UserPublicSerializer(updated_user).data)


class CsrfController(APIView):
    """Issue a CSRF token cookie for session-authenticated unsafe requests."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return api_data({"csrf_token": get_token(request)})


class RegisterController(APIView):
    """Create a reviewer or restaurant owner account and sign it in."""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return api_data(UserPublicSerializer(user).data, status_code=201)


class LoginController(APIView):
    """Authenticate a user with email and password."""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            raise ApiError(
                status_code=401,
                code="invalid_credentials",
                detail="Invalid email or password.",
            )
        login(request, user)
        return api_data(UserPublicSerializer(user).data)


class LogoutController(APIView):
    """Clear the current session."""

    def post(self, request):
        logout(request)
        return Response(status=204)


class AuthMeController(APIView):
    """Return the current authenticated user for auth flows."""

    def get(self, request):
        user = require_authenticated_user(request)
        return api_data(UserPublicSerializer(user).data)
