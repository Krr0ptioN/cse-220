"""Review domain models."""

import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Review(models.Model):
    """Restaurant review with optional threaded replies."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    content = models.TextField()
    like_count = models.PositiveIntegerField(default=0)
    dislike_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["restaurant", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["restaurant", "-like_count"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["restaurant", "user"],
                condition=models.Q(parent__isnull=True),
                name="unique_review_per_user_per_restaurant",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user} review for {self.restaurant}"


class ReviewLike(models.Model):
    """Like or dislike reaction on a review."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name="reactions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="review_reactions",
    )
    is_like = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["review", "user"],
                name="unique_reaction_per_user_per_review",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        reaction = "like" if self.is_like else "dislike"
        return f"{self.user} {reaction} {self.review_id}"
