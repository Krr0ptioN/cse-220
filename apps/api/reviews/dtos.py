"""DTO mappings for review endpoints."""

from api_http import BaseDto, dto_relation
from restaurants.dtos import RestaurantDto
from users.dtos import UserDto


class ReviewDto(BaseDto):
    """Review response DTO."""

    field_map = {
        "id": "id",
        "rating": "rating",
        "content": "content",
        "like_count": "like_count",
        "dislike_count": "dislike_count",
        "created_at": "created_at",
        "updated_at": "updated_at",
    }

    relation_map = {
        "user": dto_relation("user", UserDto),
        "restaurant": dto_relation("restaurant", RestaurantDto),
    }

    default_with = ("user",)


class ReviewLikeDto(BaseDto):
    """Review reaction response DTO."""

    field_map = {
        "id": "id",
        "is_like": "is_like",
        "created_at": "created_at",
    }

    relation_map = {
        "user": dto_relation("user", UserDto),
        "review": dto_relation("review", ReviewDto),
    }

    default_with = ("user",)
