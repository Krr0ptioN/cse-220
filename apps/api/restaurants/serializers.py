"""Restaurant serializers."""

from rest_framework import serializers

from api.serializers import DynamicFieldsModelSerializer
from restaurants.models import Category, Restaurant


class CategorySerializer(serializers.ModelSerializer):
    """Nested category serializer."""

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "icon_url", "sort_order"]


class RestaurantSerializer(DynamicFieldsModelSerializer):
    """Restaurant read serializer."""

    category = CategorySerializer(read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "phone",
            "website",
            "category",
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
            "created_at",
            "updated_at",
        ]


class RestaurantWriteSerializer(serializers.ModelSerializer):
    """Restaurant create/update serializer."""

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        required=True,
    )

    class Meta:
        model = Restaurant
        fields = [
            "name",
            "description",
            "phone",
            "website",
            "category_id",
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

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
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
        }
