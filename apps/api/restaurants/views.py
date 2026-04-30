"""Views for restaurant endpoints."""

from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from api.rest import (
    api_data,
    api_paginated,
    paginate_queryset,
    require_authenticated_user,
)
from restaurants.serializers import (
    CategorySerializer,
    RestaurantSerializer,
    RestaurantUpdateSerializer,
    RestaurantWriteSerializer,
    MenuItemSerializer,
    OpeningHourSerializer,
)
from restaurants.services import RestaurantService


class RestaurantsController(APIView):
    """List restaurants or create a new restaurant."""

    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    @extend_schema(
        summary="List restaurants",
        responses={200: RestaurantSerializer(many=True)},
        tags=["Restaurants"],
    )
    def get(self, request):
        queryset = self.get_service().list_restaurants()
        page_obj, pagination = paginate_queryset(queryset, request)
        serializer = RestaurantSerializer(page_obj.object_list, many=True)
        return api_paginated(serializer.data, pagination)

    @extend_schema(
        summary="Create restaurant",
        request=RestaurantWriteSerializer,
        responses={201: RestaurantSerializer},
        tags=["Restaurants"],
    )
    def post(self, request):
        user = require_authenticated_user(request)
        serializer = RestaurantWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        restaurant = self.get_service().create_restaurant(
            user=user,
            data=serializer.validated_data,
        )
        return api_data(RestaurantSerializer(restaurant).data, status_code=201)


class OwnerRestaurantsController(APIView):
    """List restaurants owned by the current user."""
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request):
        user = require_authenticated_user(request)
        # Service method name corrected to list_owned_restaurants
        queryset = self.get_service().list_owned_restaurants(user)
        return api_data(RestaurantSerializer(queryset, many=True).data)


class CategoryListController(APIView):
    """List categories for restaurant forms."""
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request):
        # Added missing get_service() call
        categories = self.get_service().list_categories()
        return api_data(CategorySerializer(categories, many=True).data)


class RestaurantDetailController(APIView):
    """Retrieve, update, or delete a restaurant."""
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request, slug):
        restaurant = self.get_service().get_restaurant(slug)
        return api_data(RestaurantSerializer(restaurant).data)

    def patch(self, request, slug):
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        user = require_authenticated_user(request)
        serializer = RestaurantUpdateSerializer(restaurant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        restaurant = service.update_restaurant(user=user, restaurant=restaurant, data=serializer.validated_data)
        return api_data(RestaurantSerializer(restaurant).data)

    def delete(self, request, slug):
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        user = require_authenticated_user(request)
        service.delete_restaurant(user=user, restaurant=restaurant)
        return Response(status=204)


class RestaurantOpeningHoursController(APIView):
    """List or update opening hours for a restaurant."""
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request, slug):
        restaurant = self.get_service().get_restaurant(slug)
        opening_hours = restaurant.opening_hours.all()
        return api_data(OpeningHourSerializer(opening_hours, many=True).data)


class RestaurantMenuItemsController(APIView):
    """List menu items for a restaurant."""
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request, slug):
        restaurant = self.get_service().get_restaurant(slug)
        menu_items = restaurant.menu_items.all()
        return api_data(MenuItemSerializer(menu_items, many=True).data)


class FavoriteController(APIView):
    """Add or remove a restaurant from favorites."""
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def post(self, request, slug):
        user = require_authenticated_user(request)
        self.get_service().get_restaurant(slug)
        return api_data({"message": "Added to favorites"})

    def delete(self, request, slug):
        user = require_authenticated_user(request)
        return Response(status=204)