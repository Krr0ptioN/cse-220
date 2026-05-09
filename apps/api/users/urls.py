"""URL routes for users app."""

from django.urls import path

from users.views import UserAvatarController, UsersController

urlpatterns = [
    path("me/avatar/", UserAvatarController.as_view(), name="users-me-avatar"),
    path("me/", UsersController.as_view(), name="users-me"),
]
