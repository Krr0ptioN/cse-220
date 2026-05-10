from django.db.models import Exists, OuterRef
from rest_framework.views import APIView
from wireup import Injected
from wireup.integration.django import inject

from api.rest import (
    api_data,
    require_authenticated_user,
)
from api.permissions import CanViewOwnerDashboard
from restaurants.serializers import RestaurantSerializer
from restaurants.ownership_service import RestaurantOwnershipService
from restaurants.models import Favorite

class OwnerRestaurantsController(APIView):
    """List restaurants owned by the current restaurant manager."""

    permission_classes = [CanViewOwnerDashboard]

    @inject
    def get(self, request, service: Injected[RestaurantOwnershipService]):
        user = require_authenticated_user(request)
        restaurants = service.list_owned_restaurants(user)
        restaurants = restaurants.annotate(
            is_favorite_for_user=Exists(
                Favorite.objects.filter(
                    restaurant_id=OuterRef("pk"),
                    user=user,
                )
            )
        )
        return api_data(
            RestaurantSerializer(
                restaurants,
                many=True,
                context={"request": request, "file_service": service.file_service},
            ).data
        )


class OwnerDashboardController(APIView):
    """Return analytics for the current restaurant manager."""

    permission_classes = [CanViewOwnerDashboard]

    @inject
    def get(self, request, service: Injected[RestaurantOwnershipService]):
        user = require_authenticated_user(request)
        return api_data(service.get_owner_dashboard(user))
