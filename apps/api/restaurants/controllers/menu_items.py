from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework.response import Response

from api.rest import (
    api_data,
    require_authenticated_user,
)
from restaurants.serializers import (
    MenuItemSerializer,
    MenuItemWriteSerializer,
)
from restaurants.services import RestaurantService

class RestaurantMenuItemsController(APIView):
    """List or create menu items for a restaurant."""

    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    @extend_schema(
        summary="List restaurant menu items",
        responses={200: MenuItemSerializer(many=True)},
        tags=["Menu Items"],
    )
    def get(self, request, restaurant_slug):
        service = self.get_service()
        restaurant = service.get_restaurant(restaurant_slug)
        menu_items = service.list_menu_items(restaurant)
        return api_data(MenuItemSerializer(menu_items, many=True).data)

    @extend_schema(
        summary="Create restaurant menu item",
        request=MenuItemWriteSerializer,
        responses={201: MenuItemSerializer},
        tags=["Menu Items"],
    )
    def post(self, request, restaurant_slug):
        service = self.get_service()
        restaurant = service.get_restaurant(restaurant_slug)
        user = require_authenticated_user(request)
        serializer = MenuItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        menu_item = service.create_menu_item(
            user=user,
            restaurant=restaurant,
            data=serializer.validated_data,
        )
        return api_data(MenuItemSerializer(menu_item).data, status_code=201)

class RestaurantMenuItemDetailController(APIView):
    """Retrieve, update, or delete one restaurant menu item."""

    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    @extend_schema(
        summary="Get restaurant menu item",
        responses={200: MenuItemSerializer},
        tags=["Menu Items"],
    )
    def get(self, request, restaurant_slug, menu_item_id):
        service = self.get_service()
        restaurant = service.get_restaurant(restaurant_slug)
        menu_item = service.get_menu_item(
            restaurant=restaurant,
            menu_item_id=menu_item_id,
        )
        return api_data(MenuItemSerializer(menu_item).data)

    @extend_schema(
        summary="Update restaurant menu item",
        request=MenuItemWriteSerializer,
        responses={200: MenuItemSerializer},
        tags=["Menu Items"],
    )
    def patch(self, request, restaurant_slug, menu_item_id):
        service = self.get_service()
        restaurant = service.get_restaurant(restaurant_slug)
        menu_item = service.get_menu_item(
            restaurant=restaurant,
            menu_item_id=menu_item_id,
        )
        user = require_authenticated_user(request)
        serializer = MenuItemWriteSerializer(menu_item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        menu_item = service.update_menu_item(
            user=user,
            restaurant=restaurant,
            menu_item=menu_item,
            data=serializer.validated_data,
        )
        return api_data(MenuItemSerializer(menu_item).data)

    @extend_schema(
        summary="Delete restaurant menu item",
        responses={204: None},
        tags=["Menu Items"],
    )
    def delete(self, request, restaurant_slug, menu_item_id):
        service = self.get_service()
        restaurant = service.get_restaurant(restaurant_slug)
        menu_item = service.get_menu_item(
            restaurant=restaurant,
            menu_item_id=menu_item_id,
        )
        user = require_authenticated_user(request)
        service.delete_menu_item(
            user=user,
            restaurant=restaurant,
            menu_item=menu_item,
        )
        return Response(status=204)
