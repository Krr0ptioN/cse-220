"""Review data access layer."""

from django.db.models import Avg, Count, Prefetch, Q

from restaurants.models import Restaurant
from reviews.models import Review, ReviewLike


class ReviewRepository:
    """Repository for review persistence and queries."""

    def get_review(self, review_id):
        return Review.objects.filter(id=review_id).select_related("user", "restaurant").first()

    def get_restaurant(self, restaurant_slug: str):
        return Restaurant.objects.filter(slug=restaurant_slug).first()

    def list_restaurant_reviews(self, restaurant):
        reply_queryset = (
            Review.objects.select_related("user", "restaurant")
            .annotate(
                like_total=Count(
                    "reactions",
                    filter=Q(reactions__is_like=True),
                ),
                dislike_total=Count(
                    "reactions",
                    filter=Q(reactions__is_like=False),
                ),
            )
            .order_by("created_at")
        )
        return (
            Review.objects.filter(restaurant=restaurant, parent__isnull=True)
            .select_related("user", "restaurant")
            .prefetch_related(Prefetch("replies", queryset=reply_queryset))
            .annotate(
                like_total=Count(
                    "reactions",
                    filter=Q(reactions__is_like=True),
                ),
                dislike_total=Count(
                    "reactions",
                    filter=Q(reactions__is_like=False),
                ),
            )
            .order_by("-created_at")
        )

    def get_parent_review(self, parent_id):
        return Review.objects.filter(id=parent_id).first()

    def create_review(self, *, restaurant, user, rating: int, content: str, parent=None):
        return Review.objects.create(
            restaurant=restaurant,
            user=user,
            rating=rating,
            content=content,
            parent=parent,
        )

    def save_review(self, review, data: dict):
        for field, value in data.items():
            setattr(review, field, value)
        review.save()
        return review

    def delete_review(self, review) -> None:
        review.delete()

    def set_reaction(self, *, review, user, is_like: bool) -> None:
        ReviewLike.objects.update_or_create(
            review=review,
            user=user,
            defaults={"is_like": is_like},
        )

    def delete_reaction(self, *, review, user, is_like: bool) -> None:
        ReviewLike.objects.filter(review=review, user=user, is_like=is_like).delete()

    def update_restaurant_aggregates(self, restaurant) -> None:
        aggregate = Review.objects.filter(
            restaurant=restaurant,
            parent__isnull=True,
        ).aggregate(
            review_count=Count("id"),
            avg_rating=Avg("rating"),
        )
        average = aggregate["avg_rating"]
        restaurant.review_count = aggregate["review_count"] or 0
        restaurant.average_rating = round(float(average), 2) if average is not None else 0
        restaurant.save(update_fields=["review_count", "average_rating", "updated_at"])

    def update_reaction_counts(self, review) -> None:
        review.like_count = ReviewLike.objects.filter(review=review, is_like=True).count()
        review.dislike_count = ReviewLike.objects.filter(review=review, is_like=False).count()
        review.save(update_fields=["like_count", "dislike_count", "updated_at"])
