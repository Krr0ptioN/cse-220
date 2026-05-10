from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from wireup import Injected
from wireup.integration.django import inject

from api.rest import (
    api_data,
    require_authenticated_user,
)
from api.permissions import CanManageRestaurantMedia, MethodPermissionMixin
from restaurants.serializers import (
    RestaurantPhotoSerializer,
    RestaurantSerializer,
)
from restaurants.management_service import RestaurantManagementService


class RestaurantPhotosController(MethodPermissionMixin, APIView):
    """List or upload restaurant gallery photos."""

    method_permission_classes = {
        "POST": [CanManageRestaurantMedia],
    }
    parser_classes = [MultiPartParser, FormParser]

    @inject
    def get(self, request, restaurant_slug, service: Injected[RestaurantManagementService]):
        restaurant = service.get_restaurant(restaurant_slug)
        photos = service.list_photos(restaurant=restaurant)
        return api_data(
            RestaurantPhotoSerializer(
                photos,
                many=True,
                context={"file_service": service.file_service},
            ).data
        )

    @inject
    def post(self, request, restaurant_slug, service: Injected[RestaurantManagementService]):
        restaurant = service.get_restaurant(restaurant_slug)
        self.check_object_permissions(request, restaurant)
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
        return api_data(
            RestaurantPhotoSerializer(
                photos,
                many=True,
                context={"file_service": service.file_service},
            ).data,
            status_code=201,
        )


class RestaurantPhotoDetailController(MethodPermissionMixin, APIView):
    """Delete a restaurant gallery photo."""

    method_permission_classes = {
        "DELETE": [CanManageRestaurantMedia],
    }

    @inject
    def delete(self, request, restaurant_slug, photo_id, service: Injected[RestaurantManagementService]):
        restaurant = service.get_restaurant(restaurant_slug)
        self.check_object_permissions(request, restaurant)
        user = require_authenticated_user(request)
        service.delete_photo(user=user, restaurant=restaurant, photo_id=photo_id)
        return Response(status=204)


class RestaurantPhotoPrimaryController(MethodPermissionMixin, APIView):
    """Set a restaurant gallery photo as primary."""

    method_permission_classes = {
        "POST": [CanManageRestaurantMedia],
    }

    @inject
    def post(self, request, restaurant_slug, photo_id, service: Injected[RestaurantManagementService]):
        restaurant = service.get_restaurant(restaurant_slug)
        self.check_object_permissions(request, restaurant)
        user = require_authenticated_user(request)
        updated_restaurant = service.set_primary_photo(
            user=user,
            restaurant=restaurant,
            photo_id=photo_id,
        )
        return api_data(
            RestaurantSerializer(
                updated_restaurant,
                context={"request": request, "file_service": service.file_service},
            ).data
        )
