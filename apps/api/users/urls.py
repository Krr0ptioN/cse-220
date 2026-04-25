"""URL routes for users app."""

from django.urls import path

from users.views import UsersController

urlpatterns = [
    path("me/", UsersController.as_view(), name="users-me"),
]
