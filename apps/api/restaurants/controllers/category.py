from rest_framework.views import APIView
from wireup import Injected
from wireup.integration.django import inject

from api.rest import (
    api_data,
)
from restaurants.serializers import CategorySerializer
from restaurants.discovery_service import RestaurantDiscoveryService

class CategoryListController(APIView):
    """List categories for restaurant forms."""

    @inject
    def get(self, request, service: Injected[RestaurantDiscoveryService]):
        categories = service.list_categories()
        return api_data(CategorySerializer(categories, many=True).data)
