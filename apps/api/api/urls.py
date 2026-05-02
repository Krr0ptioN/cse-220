from django.urls import path

from api.health import HealthController

urlpatterns = [
    path("", HealthController.as_view(), name="health"),
]
