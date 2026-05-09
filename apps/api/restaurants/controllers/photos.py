from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from api.rest import (
    api_data,
    require_authenticated_user,
)
from restaurants.serializers import (
    RestaurantPhotoSerializer,
    RestaurantSerializer,
)
from restaurants.services import RestaurantService


class RestaurantPhotosController(APIView):
    """List or upload restaurant gallery photos."""

    service_class = RestaurantService
    parser_classes = [MultiPartParser, FormParser]

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def get(self, request, restaurant_slug):
        service = self.get_service()
        restaurant = service.get_restaurant(restaurant_slug)
        photos = service.list_photos(restaurant=restaurant)
        return api_data(RestaurantPhotoSerializer(photos, many=True).data)

    def post(self, request, restaurant_slug):
        service = self.get_service()
        restaurant = service.get_restaurant(restaurant_slug)
        user = require_authenticated_user(request)
        uploaded_files = request.FILES.getlist("photos")

        if not uploaded_files and request.FILES.get("photo"):
            uploaded_files = [request.FILES["photo"]]

        if not uploaded_files:

            raise ValidationError({"photos": ["Upload at least one photo."]})

        photos = service.upload_photos(
            user=user,
            restaurant=restaurant,
            uploaded_files=uploaded_files,
        )
        return api_data(RestaurantPhotoSerializer(photos, many=True).data, status_code=201)


class RestaurantPhotoDetailController(APIView):
    """Delete a restaurant gallery photo."""

    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def delete(self, request, restaurant_slug, photo_id):
        service = self.get_service()
        restaurant = service.get_restaurant(restaurant_slug)
        user = require_authenticated_user(request)
        service.delete_photo(user=user, restaurant=restaurant, photo_id=photo_id)
        return Response(status=204)


class RestaurantPhotoPrimaryController(APIView):
    """Set a restaurant gallery photo as primary."""

    service_class = RestaurantService

    def get_service(self) -> RestaurantService:
        return self.service_class()

    def post(self, request, restaurant_slug, photo_id):
        service = self.get_service()
        restaurant = service.get_restaurant(restaurant_slug)
        user = require_authenticated_user(request)
        updated_restaurant = service.set_primary_photo(
            user=user,
            restaurant=restaurant,
            photo_id=photo_id,
        )
        return api_data(RestaurantSerializer(updated_restaurant, context={"request": request}).data)

