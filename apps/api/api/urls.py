"""URL patterns for the api app."""

from django.urls import path, include
from api_http import build_urlpatterns
from api.health import HealthController

urlpatterns = [
    path("", include(build_urlpatterns(HealthController))),
]