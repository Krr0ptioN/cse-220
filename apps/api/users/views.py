"""Views for user endpoints."""

from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from rest_framework.response import Response
from rest_framework.views import APIView

from api.exceptions import ApiError
from api.rest import api_data, require_authenticated_user
from users.serializers import LoginSerializer, RegisterSerializer, UserPublicSerializer
from users.services import UserService


class UsersController(APIView):
    """Controller for users endpoints."""

    service_class = UserService

    def get_service(self) -> UserService:
        return self.service_class()

    def get(self, request):
        user = require_authenticated_user(request)
        return api_data(self.get_service().me(user))


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
