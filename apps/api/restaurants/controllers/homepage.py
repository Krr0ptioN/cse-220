from rest_framework.views import APIView

from api.rest import (
    api_data,
)
from restaurants.serializers import (
    RestaurantSerializer,
)
from restaurants.services import RestaurantService

class RestaurantHomepageController(APIView):
    """Return homepage discovery sections."""

    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request):
        sections = self.get_service().get_homepage_sections(limit=5)
        return api_data(
            {
                "top_rated": RestaurantSerializer(
                    sections["top_rated"],
                    many=True,
                    context={"request": request},
                ).data,
                "newest": RestaurantSerializer(
                    sections["newest"],
                    many=True,
                    context={"request": request},
                ).data,
            }
        )
