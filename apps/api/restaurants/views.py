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

    @extend_schema(summary="List restaurants", responses={200: RestaurantSerializer(many=True)}, tags=["Restaurants"])
    def get(self, request):
        queryset = self.get_service().list_restaurants()
        page_obj, pagination = paginate_queryset(queryset, request)
        serializer = RestaurantSerializer(page_obj.object_list, many=True)
        return api_paginated(serializer.data, pagination)

    @extend_schema(summary="Create restaurant", request=RestaurantWriteSerializer, responses={201: RestaurantSerializer}, tags=["Restaurants"])
    def post(self, request):
        user = require_authenticated_user(request)
        serializer = RestaurantWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        restaurant = self.get_service().create_restaurant(user=user, data=serializer.validated_data)
        return api_data(RestaurantSerializer(restaurant).data, status_code=201)

class OwnerRestaurantsController(APIView):
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request):
        user = require_authenticated_user(request)
        queryset = self.get_service().list_owned_restaurants(user)
        return api_data(RestaurantSerializer(queryset, many=True).data)

class RestaurantDetailController(APIView):
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

class RestaurantMenuItemsController(APIView):
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request, slug):
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        menu_items = service.list_menu_items(restaurant)
        return api_data(MenuItemSerializer(menu_items, many=True).data)

    def post(self, request, slug):
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        user = require_authenticated_user(request)
        serializer = MenuItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        menu_item = service.create_menu_item(user=user, restaurant=restaurant, data=serializer.validated_data)
        return api_data(MenuItemSerializer(menu_item).data, status_code=201)

class RestaurantMenuItemDetailController(APIView):
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request, slug, menu_item_id):
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        menu_item = service.get_menu_item(restaurant=restaurant, menu_item_id=menu_item_id)
        return api_data(MenuItemSerializer(menu_item).data)

    def patch(self, request, slug, menu_item_id):
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        menu_item = service.get_menu_item(restaurant=restaurant, menu_item_id=menu_item_id)
        user = require_authenticated_user(request)
        serializer = MenuItemWriteSerializer(menu_item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        menu_item = service.update_menu_item(user=user, restaurant=restaurant, menu_item=menu_item, data=serializer.validated_data)
        return api_data(MenuItemSerializer(menu_item).data)

    def delete(self, request, slug, menu_item_id):
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        menu_item = service.get_menu_item(restaurant=restaurant, menu_item_id=menu_item_id)
        user = require_authenticated_user(request)
        service.delete_menu_item(user=user, restaurant=restaurant, menu_item=menu_item)
        return Response(status=204)

class RestaurantOpeningHoursController(APIView):
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request, slug):
        restaurant = self.get_service().get_restaurant(slug)
        opening_hours = restaurant.opening_hours.all()
        return api_data(OpeningHourSerializer(opening_hours, many=True).data)

    def post(self, request, slug):
        user = require_authenticated_user(request)
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        serializer = OpeningHourSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        hours = service.set_opening_hours(user=user, restaurant=restaurant, hours_data=serializer.validated_data)
        return api_data(OpeningHourSerializer(hours, many=True).data)

class CategoryListController(APIView):
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request):
        categories = self.get_service().list_categories()
        return api_data(CategorySerializer(categories, many=True).data)

class FavoriteController(APIView):
    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def post(self, request, slug):
        require_authenticated_user(request)
        self.get_service().get_restaurant(slug)
        return api_data({"message": "Added to favorites"})

    def delete(self, request, slug):
        require_authenticated_user(request)
        return Response(status=204)