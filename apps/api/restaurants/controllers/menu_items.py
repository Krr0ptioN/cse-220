from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView
from wireup import Injected
from wireup.integration.django import inject

from api.rest import (
    api_data,
    require_authenticated_user,
)
from api.permissions import CanManageRestaurantMenu, MethodPermissionMixin
from restaurants.serializers import (
    MenuItemSerializer,
    MenuItemWriteSerializer,
)
from restaurants.management_service import RestaurantManagementService

class RestaurantMenuItemsController(MethodPermissionMixin, APIView):
    """List or create menu items for a restaurant."""

    method_permission_classes = {
        "POST": [CanManageRestaurantMenu],
    }

    @extend_schema(
        summary="List restaurant menu items",
        responses={200: MenuItemSerializer(many=True)},
        tags=["Menu Items"],
    )
    @inject
    def get(self, request, restaurant_slug, service: Injected[RestaurantManagementService]):
        restaurant = service.get_restaurant(restaurant_slug)
        menu_items = service.list_menu_items(restaurant)
        return api_data(
            MenuItemSerializer(
                menu_items,
                many=True,
                context={"file_service": service.file_service},
            ).data
        )

    @extend_schema(
        summary="Create restaurant menu item",
        request=MenuItemWriteSerializer,
        responses={201: MenuItemSerializer},
        tags=["Menu Items"],
    )
    @inject
    def post(self, request, restaurant_slug, service: Injected[RestaurantManagementService]):
        restaurant = service.get_restaurant(restaurant_slug)
        self.check_object_permissions(request, restaurant)
        user = require_authenticated_user(request)
        serializer = MenuItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        menu_item = service.create_menu_item(
            user=user,
            restaurant=restaurant,
            data=serializer.validated_data,
        )
        return api_data(
            MenuItemSerializer(
                menu_item,
                context={"file_service": service.file_service},
            ).data,
            status_code=201,
        )

class RestaurantMenuItemDetailController(MethodPermissionMixin, APIView):
    """Retrieve, update, or delete one restaurant menu item."""

    method_permission_classes = {
        "PATCH": [CanManageRestaurantMenu],
        "DELETE": [CanManageRestaurantMenu],
    }

    @extend_schema(
        summary="Get restaurant menu item",
        responses={200: MenuItemSerializer},
        tags=["Menu Items"],
    )
    @inject
    def get(self, request, restaurant_slug, menu_item_id, service: Injected[RestaurantManagementService]):
        restaurant = service.get_restaurant(restaurant_slug)
        menu_item = service.get_menu_item(
            restaurant=restaurant,
            menu_item_id=menu_item_id,
        )
        return api_data(
            MenuItemSerializer(
                menu_item,
                context={"file_service": service.file_service},
            ).data
        )

    @extend_schema(
        summary="Update restaurant menu item",
        request=MenuItemWriteSerializer,
        responses={200: MenuItemSerializer},
        tags=["Menu Items"],
    )
    @inject
    def patch(self, request, restaurant_slug, menu_item_id, service: Injected[RestaurantManagementService]):
        restaurant = service.get_restaurant(restaurant_slug)
        self.check_object_permissions(request, restaurant)
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
        return api_data(
            MenuItemSerializer(
                menu_item,
                context={"file_service": service.file_service},
            ).data
        )

    @extend_schema(
        summary="Delete restaurant menu item",
        responses={204: None},
        tags=["Menu Items"],
    )
    @inject
    def delete(self, request, restaurant_slug, menu_item_id, service: Injected[RestaurantManagementService]):
        restaurant = service.get_restaurant(restaurant_slug)
        self.check_object_permissions(request, restaurant)
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
