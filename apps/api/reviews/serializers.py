"""Review serializers."""

from rest_framework import serializers

from reviews.models import Review
from users.serializers import UserPublicSerializer


class ReviewSerializer(serializers.ModelSerializer):
    """Read serializer for reviews."""

    user = UserPublicSerializer(read_only=True)
    parent_id = serializers.UUIDField(read_only=True)
    is_business_answer = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    dislike_count = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "parent_id",
            "rating",
            "content",
            "like_count",
            "dislike_count",
            "is_business_answer",
            "replies",
            "created_at",
            "updated_at",
            "user",
        ]

    def get_like_count(self, obj) -> int:
        return getattr(obj, "like_total", obj.like_count)

    def get_dislike_count(self, obj) -> int:
        return getattr(obj, "dislike_total", obj.dislike_count)

    def get_is_business_answer(self, obj) -> bool:
        return _is_business_answer(obj)

    def get_replies(self, obj):
        if obj.parent_id is not None:
            return None
        return ReviewReplySerializer(obj.replies.all(), many=True).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.parent_id is not None:
            data.pop("replies", None)
        return data


class ReviewReplySerializer(serializers.ModelSerializer):
    """Read serializer for one-level review replies."""

    user = UserPublicSerializer(read_only=True)
    parent_id = serializers.UUIDField(read_only=True)
    is_business_answer = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    dislike_count = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "parent_id",
            "rating",
            "content",
            "like_count",
            "dislike_count",
            "is_business_answer",
            "created_at",
            "updated_at",
            "user",
        ]

    def get_like_count(self, obj) -> int:
        return getattr(obj, "like_total", obj.like_count)

    def get_dislike_count(self, obj) -> int:
        return getattr(obj, "dislike_total", obj.dislike_count)

    def get_is_business_answer(self, obj) -> bool:
        return _is_business_answer(obj)


def _is_business_answer(review) -> bool:
    restaurant = getattr(review, "restaurant", None)
    user = getattr(review, "user", None)
    return bool(
        review.parent_id
        and restaurant is not None
        and user is not None
        and restaurant.owner_id == user.id
    )


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
