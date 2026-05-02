from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from api.rest import (
    api_data,
    api_paginated,
    paginate_queryset,
    parse_csv_param,
    require_authenticated_user,
)
from restaurants.serializers import (
    CategorySerializer,
    MenuItemSerializer,
    MenuItemWriteSerializer,
    RestaurantSerializer,
    RestaurantUpdateSerializer,
    RestaurantWriteSerializer,
    OpeningHourSerializer,
)
from restaurants.services import RestaurantService


class RestaurantsController(APIView):
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    @extend_schema(
        summary="List restaurants",
        parameters=[
            OpenApiParameter("page", OpenApiTypes.INT),
            OpenApiParameter("page_size", OpenApiTypes.INT),
            OpenApiParameter("include", OpenApiTypes.STR),
            OpenApiParameter("with", OpenApiTypes.STR),
            OpenApiParameter("omit", OpenApiTypes.STR),
        ],
        responses={200: RestaurantSerializer(many=True)},
        tags=["Restaurants"],
    )
    def get(self, request):
        queryset = self.get_service().list_restaurants()
        page_obj, pagination = paginate_queryset(queryset, request)

        include_fields = parse_csv_param(request.query_params.get("include"))
        with_fields = parse_csv_param(request.query_params.get("with"))
        if include_fields:
            include_fields = [*include_fields, *with_fields]

        include_fields = include_fields or None
        omit_fields = parse_csv_param(request.query_params.get("omit")) or None

        serializer = RestaurantSerializer(
            page_obj.object_list,
            many=True,
            include=include_fields,
            omit=omit_fields,
        )
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


class CategoryListController(APIView):
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request):
        categories = self.get_service().list_categories()
        return api_data(CategorySerializer(categories, many=True).data)


class OwnerRestaurantsController(APIView):
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request):
        user = require_authenticated_user(request)
        restaurants = self.get_service().list_owned_restaurants(user)
        return api_data(RestaurantSerializer(restaurants, many=True).data)


class RestaurantMenuItemsController(APIView):
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


class RestaurantDetailController(APIView):
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    @extend_schema(
        summary="Get restaurant details",
        responses={200: RestaurantSerializer},
        tags=["Restaurants"],
    )
    def get(self, request, slug):
        restaurant = self.get_service().get_restaurant(slug)
        return api_data(RestaurantSerializer(restaurant).data)

    @extend_schema(
        summary="Update restaurant",
        request=RestaurantUpdateSerializer,
        responses={200: RestaurantSerializer},
        tags=["Restaurants"],
    )
    def patch(self, request, slug):
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        user = require_authenticated_user(request)
        serializer = RestaurantUpdateSerializer(restaurant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        restaurant = service.update_restaurant(
            user=user,
            restaurant=restaurant,
            data=serializer.validated_data,
        )
        return api_data(RestaurantSerializer(restaurant).data)

    @extend_schema(
        summary="Delete restaurant",
        responses={204: None},
        tags=["Restaurants"],
    )
    def delete(self, request, slug):
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        user = require_authenticated_user(request)
        service.delete_restaurant(user=user, restaurant=restaurant)
        return Response(status=204)