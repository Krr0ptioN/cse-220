from rest_framework.views import APIView
from wireup import Injected
from wireup.integration.django import inject
from api.permissions import CanUseFavorites, MethodPermissionMixin
from .common import pagination_and_filter_parameters
from api.rest import (
    paginate_queryset,
    parse_csv_param,
    api_paginated,
    api_data,
    require_authenticated_user,
)
from restaurants.serializers import RestaurantSerializer
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from restaurants.discovery_service import RestaurantDiscoveryService
from restaurants.favorites_service import RestaurantFavoritesService

class ReviewerFavoriteRestaurantListController(MethodPermissionMixin, APIView):
    permission_classes = [CanUseFavorites]

    @extend_schema(
        summary="User's favorite restaurants list",
        description=(
            "Retrieve a paginated list of restaurants favored by reviewer. Supports field filtering, "
            "advanced restaurant filters, and relation expansion through query parameters."
        ),
        parameters=pagination_and_filter_parameters,
        responses={200: RestaurantSerializer(many=True)},
        tags=["Restaurants", "Favorites"],
    )
    @inject
    def get(self, request, service: Injected[RestaurantDiscoveryService]):
        user = require_authenticated_user(request)
        filters = {
            "category": request.query_params.get("category"),
            "city": request.query_params.get("city"),
            "location": request.query_params.get("location"),
            "price": request.query_params.get("price"),
            "price_range": request.query_params.get("price_range"),
            "min_rating": request.query_params.get("min_rating"),
            "latitude": request.query_params.get("latitude") or request.query_params.get("lat"),
            "longitude": request.query_params.get("longitude") or request.query_params.get("lng"),
            "search": request.query_params.get("q") or request.query_params.get("search"),
        }

        sort = request.query_params.get("sort")

        queryset = service.list_favorite_restaurants(
            user=user,
            filters=filters,
            sort=sort,
        )

        page_obj, pagination = paginate_queryset(queryset, request)

        include_fields = parse_csv_param(
            request.query_params.get("include")
        )

        with_fields = parse_csv_param(
            request.query_params.get("with")
        )

        if include_fields:
            include_fields = [
                *include_fields,
                *with_fields,
            ]

        include_fields = include_fields or None

        omit_fields = (
            parse_csv_param(
                request.query_params.get("omit")
            )
            or None
        )

        serializer = RestaurantSerializer(
            page_obj.object_list,
            many=True,
            include=include_fields,
            omit=omit_fields,
            context={"request": request, "file_service": service.file_service},
        )

        return api_paginated(
            serializer.data,
            pagination,
        )

class FavoriteRestaurantResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    is_favorite = serializers.BooleanField()
    favorite_count = serializers.IntegerField()
    favorite_score = serializers.IntegerField()
    last_favorited_at = serializers.DateTimeField(allow_null=True)
    restaurant = RestaurantSerializer()


class UnfavoriteRestaurantResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    is_favorite = serializers.BooleanField()
    favorite_count = serializers.IntegerField()
    favorite_score = serializers.IntegerField()
    last_favorited_at = serializers.DateTimeField(allow_null=True)
    restaurant = RestaurantSerializer()

class ReviewerFavoriteRestaurantController(MethodPermissionMixin, APIView):
    permission_classes = [CanUseFavorites]

    @extend_schema(
        summary="User favorite restaurant",
        description=(
            "Add a restaurant to the reviewer's favorites. "
        ),
        responses={
            200: FavoriteRestaurantResponseSerializer,
            201: FavoriteRestaurantResponseSerializer,
        },
        tags=["Restaurants", "Favorites"],
    )
    @inject
    def post(self, request, restaurant_slug, pk=None, *, service: Injected[RestaurantFavoritesService]):
        user = require_authenticated_user(request)
        restaurant, created = service.favorite_restaurant(
            user=user,
            restaurant_slug=restaurant_slug,
        )

        serializer = RestaurantSerializer(
            restaurant,
            context={"request": request, "file_service": service.file_service},
        )
        restaurant_data = serializer.data

        return api_data(
            {
                "detail": "Restaurant added to favorites."
                if created
                else "Restaurant is already in favorites.",
                "is_favorite": True,
                "favorite_count": restaurant_data["favorite_count"],
                "favorite_score": restaurant_data["favorite_score"],
                "last_favorited_at": restaurant_data["last_favorited_at"],
                "restaurant": restaurant_data,
            },
            status_code=201 if created else 200,
        )

    @extend_schema(
        summary="User unfavorite restaurant",
        description=(
            "Remove a restaurant from the reviewer's favorites. "
        ),
        responses={200: UnfavoriteRestaurantResponseSerializer},
        tags=["Restaurants", "Favorites"],
    )
    @inject
    def delete(self, request, restaurant_slug, pk=None, *, service: Injected[RestaurantFavoritesService]):
        user = require_authenticated_user(request)
        restaurant, was_deleted = service.unfavorite_restaurant(
            user=user,
            restaurant_slug=restaurant_slug,
        )
        serializer = RestaurantSerializer(
            restaurant,
            context={"request": request, "file_service": service.file_service},
        )
        restaurant_data = serializer.data

        return api_data(
            {
                "detail": "Restaurant removed from favorites."
                if was_deleted
                else "Restaurant was not in favorites.",
                "is_favorite": False,
                "favorite_count": restaurant_data["favorite_count"],
                "favorite_score": restaurant_data["favorite_score"],
                "last_favorited_at": restaurant_data["last_favorited_at"],
                "restaurant": restaurant_data,
            },
        )
