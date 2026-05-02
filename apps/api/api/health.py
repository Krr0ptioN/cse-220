"""Health check endpoint for FlavorMap API."""

from datetime import datetime, timezone

from rest_framework.response import Response
from rest_framework.views import APIView

from api.services import HealthService

START_TIME = datetime.now(timezone.utc)


class HealthController(APIView):
    """Controller for the health endpoint."""

    service_class = HealthService

    def get_service(self) -> HealthService:
        return self.service_class(start_time=START_TIME)

    def get(self, request):
        return Response(self.get_service().health())
