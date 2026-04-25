"""Review serializers."""

from rest_framework import serializers

from reviews.models import Review
from users.serializers import UserPublicSerializer


class ReviewSerializer(serializers.ModelSerializer):
    """Read serializer for reviews."""

    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "rating",
            "content",
            "like_count",
            "dislike_count",
            "created_at",
            "updated_at",
            "user",
        ]


class ReviewCreateSerializer(serializers.Serializer):
    """Request serializer for review creation."""

    rating = serializers.IntegerField(min_value=1, max_value=5)
    content = serializers.CharField(min_length=10, max_length=5000, trim_whitespace=True)
    parent_id = serializers.UUIDField(required=False)


class ReviewUpdateSerializer(serializers.Serializer):
    """Request serializer for review updates."""

    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    content = serializers.CharField(
        min_length=10,
        max_length=5000,
        trim_whitespace=True,
        required=False,
    )

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "At least one field is required to update a review."
            )
        return attrs
