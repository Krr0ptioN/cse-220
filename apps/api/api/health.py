"""Health check endpoint for FlavorMap API."""

from rest_framework.response import Response
from rest_framework.views import APIView
from wireup import Injected
from wireup.integration.django import inject

from api.services import HealthService


class HealthController(APIView):
    """Controller for the health endpoint."""

    @inject
    def get(self, request, service: Injected[HealthService]):
        return Response(service.health())
