from django.contrib import admin

from reviews.models import Review, ReviewLike


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin settings for reviews."""

    list_display = (
        "id",
        "restaurant",
        "user",
        "rating",
        "like_count",
        "dislike_count",
        "created_at",
    )
    list_filter = ("rating", "created_at")
    search_fields = ("restaurant__name", "user__email", "content")
    ordering = ("-created_at",)


@admin.register(ReviewLike)
class ReviewLikeAdmin(admin.ModelAdmin):
    """Admin settings for review reactions."""

    list_display = ("review", "user", "is_like", "created_at")
    list_filter = ("is_like", "created_at")
    search_fields = ("review__id", "user__email")
    ordering = ("-created_at",)
