"""URL routes for authentication endpoints."""

from django.urls import path

from users.views import (
    AuthMeController,
    CsrfController,
    LoginController,
    LogoutController,
    RegisterController,
)

urlpatterns = [
    path("csrf/", CsrfController.as_view(), name="auth-csrf"),
    path("register/", RegisterController.as_view(), name="auth-register"),
    path("login/", LoginController.as_view(), name="auth-login"),
    path("logout/", LogoutController.as_view(), name="auth-logout"),
    path("me/", AuthMeController.as_view(), name="auth-me"),
]
