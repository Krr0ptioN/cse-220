from django.db.models import Exists, OuterRef
from rest_framework.views import APIView

from api.rest import (
    api_data,
    require_authenticated_user,
)
from restaurants.serializers import RestaurantSerializer
from restaurants.services import RestaurantService
from restaurants.models import Favorite

class OwnerRestaurantsController(APIView):
    """List restaurants owned by the current restaurant manager."""

    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request):
        user = require_authenticated_user(request)
        restaurants = self.get_service().list_owned_restaurants(user)
        restaurants = restaurants.annotate(
            is_favorite_for_user=Exists(
                Favorite.objects.filter(
                    restaurant_id=OuterRef("pk"),
                    user=user,
                )
            )
        )
        return api_data(
            RestaurantSerializer(restaurants, many=True, context={"request": request}).data
        )


class OwnerDashboardController(APIView):
    """Return analytics for the current restaurant manager."""

    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request):
        user = require_authenticated_user(request)
        return api_data(self.get_service().get_owner_dashboard(user))

