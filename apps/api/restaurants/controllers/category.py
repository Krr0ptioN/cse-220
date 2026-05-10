from rest_framework.views import APIView

from api.rest import (
    api_data,
)
from restaurants.serializers import CategorySerializer
from restaurants.services import RestaurantService

class CategoryListController(APIView):
    """List categories for restaurant forms."""

    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request):
        categories = self.get_service().list_categories()
        return api_data(CategorySerializer(categories, many=True).data)

