"""URL patterns for the api app."""

from . import views
from django.urls import path
from . import health

urlpatterns = [
    path("", lambda request: health.health(), name="health"),
    path("resturants/", views.create_resturant, name="resturants"),
]
