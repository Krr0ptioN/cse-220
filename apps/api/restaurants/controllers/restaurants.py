from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema
from django.db.models import Exists, OuterRef
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from api.rest import (
    api_data,
    require_authenticated_user,
)
from restaurants.serializers import (
    RestaurantSerializer,
    RestaurantUpdateSerializer,
    RestaurantWriteSerializer,
)
from restaurants.services import RestaurantService
from api.rest import (
    api_paginated,
    paginate_queryset,
    parse_csv_param,
)
from restaurants.models import Favorite

class RestaurantsController(APIView):
    """List restaurants or create a new restaurant."""

    service_class = RestaurantService
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_service(self) -> RestaurantService:
        return self.service_class()

    @extend_schema(
        summary="List restaurants",
        description=(
            "Retrieve a paginated list of restaurants. Supports field filtering, "
            "advanced restaurant filters, and relation expansion through query parameters."
        ),
        parameters=[
            OpenApiParameter(
                "page",
                OpenApiTypes.INT,
                description="A page number within the paginated result set.",
            ),
            OpenApiParameter(
                "page_size",
                OpenApiTypes.INT,
                description="Number of results to return per page.",
            ),
            OpenApiParameter(
                "include",
                OpenApiTypes.STR,
                description="Comma-separated list of fields to include in the response.",
            ),
            OpenApiParameter(
                "with",
                OpenApiTypes.STR,
                description="Comma-separated list of relations to expand.",
            ),
            OpenApiParameter(
                "omit",
                OpenApiTypes.STR,
                description="Comma-separated list of fields to exclude from the response.",
            ),
            OpenApiParameter(
                "category",
                OpenApiTypes.STR,
                description="Filter restaurants by category slug.",
            ),
            OpenApiParameter(
                "city",
                OpenApiTypes.STR,
                description="Filter restaurants by city. Case-insensitive.",
            ),
            OpenApiParameter(
                "price",
                OpenApiTypes.STR,
                description="Filter restaurants by price range: 1, 2, or 3.",
            ),
            OpenApiParameter(
                "price_range",
                OpenApiTypes.STR,
                description="Alias for price. Filter restaurants by price range: 1, 2, or 3.",
            ),
            OpenApiParameter(
                "min_rating",
                OpenApiTypes.NUMBER,
                description="Filter restaurants with average rating greater than or equal to this value.",
            ),
        ],
        responses={200: RestaurantSerializer(many=True)},
        tags=["Restaurants"],
    )
    def get(self, request):
        filters = {
            "category": request.query_params.get("category"),
            "city": request.query_params.get("city"),
            "price": request.query_params.get("price"),
            "price_range": request.query_params.get("price_range"),
            "min_rating": request.query_params.get("min_rating"),
            "search": request.query_params.get("q") or request.query_params.get("search"),
        }

        sort = request.query_params.get("sort")
        queryset = self.get_service().list_restaurants(filters, sort=sort)
        if request.user.is_authenticated:
            queryset = queryset.annotate(
                is_favorite_for_user=Exists(
                    Favorite.objects.filter(
                        restaurant_id=OuterRef("pk"),
                        user=request.user,
                    )
                )
            )

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
            context={"request": request},
        )
        return api_paginated(serializer.data, pagination)

    @extend_schema(
        summary="Create restaurant",
        description="Register a new restaurant spot in the platform. Requires owner role.",
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
        return api_data(
            RestaurantSerializer(restaurant, context={"request": request}).data,
            status_code=201,
        )



class RestaurantDetailController(APIView):
    """Retrieve, update, or delete a restaurant."""

    service_class = RestaurantService
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_service(self) -> RestaurantService:
        return self.service_class()

    @extend_schema(
        summary="Get restaurant details",
        description="Retrieve detailed information about a specific restaurant by its unique slug.",
        responses={200: RestaurantSerializer},
        tags=["Restaurants"],
    )
    def get(self, request, slug):
        restaurant = self.get_service().get_restaurant(slug)
        return api_data(RestaurantSerializer(restaurant, context={"request": request}).data)

    @extend_schema(
        summary="Update restaurant",
        description="Modify an existing restaurant's details. Must be the restaurant owner.",
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
        return api_data(RestaurantSerializer(restaurant, context={"request": request}).data)

    @extend_schema(
        summary="Delete restaurant",
        description="Permanently remove a restaurant from the platform. Requires admin role.",
        responses={204: None},
        tags=["Restaurants"],
    )
    def delete(self, request, slug):
        service = self.get_service()
        restaurant = service.get_restaurant(slug)
        user = require_authenticated_user(request)
        service.delete_restaurant(user=user, restaurant=restaurant)
        return Response(status=204)
