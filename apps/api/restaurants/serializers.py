"""Restaurant serializers."""

from rest_framework import serializers

from api.serializers import DynamicFieldsModelSerializer
from files.services import create_file_service
from restaurants.models import Category, MenuItem, OpeningHour, Restaurant

class CategorySerializer(serializers.ModelSerializer):
    """Nested category serializer."""

    icon_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "icon", "icon_url", "sort_order"]

    def get_icon_url(self, obj) -> str | None:
        if not obj.icon_id:
            return None
        return create_file_service().get_obfuscated_url(obj.icon_id)


class OpeningHourSerializer(serializers.ModelSerializer):
    """Restaurant opening hours serializer."""

    day_display = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = OpeningHour
        fields = ["id", "day_of_week", "day_display", "open_time", "close_time", "is_closed"]


class MenuItemSerializer(serializers.ModelSerializer):
    """Restaurant menu item read serializer."""

    restaurant_id = serializers.UUIDField(read_only=True)
    category = CategorySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "restaurant_id",
            "name",
            "description",
            "category",
            "price",
            "currency",
            "image",
            "image_url",
            "is_available",
            "sort_order",
        ]

    def get_image_url(self, obj) -> str | None:
        if not obj.image_id:
            return None
        return create_file_service().get_obfuscated_url(obj.image_id)


class MenuItemWriteSerializer(serializers.ModelSerializer):
    """Request serializer for menu item create/update."""

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        required=True,
    )
    currency = serializers.CharField(max_length=3, required=True)
    is_available = serializers.BooleanField(required=True)

    class Meta:
        model = MenuItem
        fields = [
            "name",
            "description",
            "category_id",
            "price",
            "currency",
            "image",
            "is_available",
            "sort_order",
        ]
        extra_kwargs = {
            "description": {"required": False},
            "image": {"required": False},
            "sort_order": {"required": False},
        }


class RestaurantSerializer(DynamicFieldsModelSerializer):
    """Restaurant read serializer."""

    categories = CategorySerializer(many=True, read_only=True)
    opening_hours = OpeningHourSerializer(many=True, read_only=True)
    primary_photo_url = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "phone",
            "website",
            "categories",
            "opening_hours",
            "primary_photo_url",
            "address_line1",
            "address_line2",
            "city",
            "district",
            "postal_code",
            "latitude",
            "longitude",
            "price_range",
            "average_rating",
            "review_count",
            "favorite_count",
            "favorite_score",
            "last_favorited_at",
            "is_favorite",
            "created_at",
            "updated_at",
        ]

    def get_primary_photo_url(self, obj) -> str | None:
        if not obj.primary_photo_id:
            return None
        return create_file_service().get_obfuscated_url(obj.primary_photo_id)

    def get_is_favorite(self, obj) -> bool:
        annotated_value = getattr(obj, "is_favorite_for_user", None)
        if annotated_value is not None:
            return bool(annotated_value)

        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return False
        return obj.favorited_by.filter(user=user).exists()


class RestaurantWriteSerializer(serializers.ModelSerializer):
    """Restaurant create serializer."""

    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="categories",
        many=True,
        required=True,
    )
    opening_hours = OpeningHourSerializer(many=True, required=False)
    primary_photo = serializers.ImageField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Restaurant
        fields = [
            "name",
            "description",
            "phone",
            "website",
            "category_ids",
            "opening_hours",
            "primary_photo",
            "address_line1",
            "address_line2",
            "city",
            "district",
            "postal_code",
            "latitude",
            "longitude",
            "price_range",
        ]

class RestaurantUpdateSerializer(RestaurantWriteSerializer):
    """Partial update serializer for restaurant edits."""

    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="categories",
        many=True,
        required=False,
    )

    class Meta(RestaurantWriteSerializer.Meta):
        extra_kwargs = {
            "name": {"required": False},
            "description": {"required": False},
            "phone": {"required": False},
            "website": {"required": False},
            "address_line1": {"required": False},
            "address_line2": {"required": False},
            "city": {"required": False},
            "district": {"required": False},
            "postal_code": {"required": False},
            "latitude": {"required": False},
            "longitude": {"required": False},
            "price_range": {"required": False},
            "primary_photo": {"required": False},
        }
