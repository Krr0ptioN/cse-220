from rest_framework.views import APIView
from wireup import Injected
from wireup.integration.django import inject

from api.rest import (
    api_data,
)
from restaurants.serializers import (
    RestaurantSerializer,
)
from restaurants.discovery_service import RestaurantDiscoveryService

class RestaurantHomepageController(APIView):
    """Return homepage discovery sections."""

    @inject
    def get(self, request, service: Injected[RestaurantDiscoveryService]):
        sections = service.get_homepage_sections(limit=5)
        return api_data(
            {
                "top_rated": RestaurantSerializer(
                    sections["top_rated"],
                    many=True,
                    context={"request": request, "file_service": service.file_service},
                ).data,
                "newest": RestaurantSerializer(
                    sections["newest"],
                    many=True,
                    context={"request": request, "file_service": service.file_service},
                ).data,
            }
        )
