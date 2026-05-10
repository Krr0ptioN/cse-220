"""Restaurant owner dashboard service."""

from __future__ import annotations

from collections import defaultdict

from django.db.models import Avg, Count, Max, Min
from wireup import injectable

from api.exceptions import ApiError
from restaurants.repositories import RestaurantRepository
from restaurants.service_base import RestaurantServiceBase
from reviews.models import Review


@injectable
class RestaurantOwnershipService(RestaurantServiceBase):
    """Coordinates owner-scoped restaurant operations."""

    def __init__(self, repository: RestaurantRepository | None = None) -> None:
        super().__init__(repository=repository)

    @property
    def service_name(self) -> str:
        return "ownership"

    def list_owned_restaurants(self, user):
        decision = self.policies.can_view_owner_dashboard(user)
        if not decision.allowed:
            raise ApiError(status_code=403, code="forbidden", detail=decision.reason)
        return self.repository.list_by_owner(user)

    def get_owner_dashboard(self, user):
        restaurants = list(self.list_owned_restaurants(user))
        reviews = list(
            Review.objects.filter(
                restaurant__in=restaurants,
                parent__isnull=True,
            )
            .select_related("restaurant", "user")
            .order_by("created_at")
        )

        return {
            "summary": self._build_owner_summary(restaurants, reviews),
            "restaurants": self._build_dashboard_restaurants(restaurants, reviews),
            "reviewers": self._build_reviewer_stats(reviews),
        }

    def _build_owner_summary(self, restaurants, reviews: list[Review]) -> dict:
        return {
            "restaurant_count": len(restaurants),
            "review_count": len(reviews),
            "reviewer_count": len({review.user_id for review in reviews}),
            "average_rating": self._average_rating(reviews),
            "favorite_count": sum(restaurant.favorite_count for restaurant in restaurants),
            "favorite_score": sum(restaurant.favorite_score for restaurant in restaurants),
        }

    def _build_dashboard_restaurants(self, restaurants, reviews: list[Review]) -> list[dict]:
        reviews_by_restaurant = defaultdict(list)
        for review in reviews:
            reviews_by_restaurant[review.restaurant_id].append(review)

        serialized = []
        from restaurants.serializers import RestaurantSerializer

        payload = RestaurantSerializer(
            restaurants,
            many=True,
            context={"file_service": self.file_service},
        ).data
        for restaurant, row in zip(restaurants, payload, strict=False):
            restaurant_reviews = reviews_by_restaurant[restaurant.id]
            serialized.append(
                {
                    **row,
                    "average_rating": self._average_rating(restaurant_reviews),
                    "review_count": len(restaurant_reviews),
                    "reviewer_stats": self._build_reviewer_stats(restaurant_reviews),
                    "rating_progress": self._build_rating_progress(restaurant_reviews),
                }
            )

        return serialized

    def _build_reviewer_stats(self, reviews: list[Review]) -> list[dict]:
        if not reviews:
            return []

        reviewer_rows = (
            Review.objects.filter(id__in=[review.id for review in reviews])
            .values("user_id", "user__username", "user__display_name")
            .annotate(
                review_count=Count("id"),
                average_rating=Avg("rating"),
                restaurant_count=Count("restaurant_id", distinct=True),
                first_review_at=Min("created_at"),
                last_review_at=Max("created_at"),
            )
            .order_by("-review_count", "-last_review_at")
        )

        return [
            {
                "id": str(row["user_id"]),
                "username": row["user__username"],
                "display_name": row["user__display_name"] or row["user__username"],
                "review_count": row["review_count"],
                "average_rating": self._round_rating(row["average_rating"]),
                "restaurant_count": row["restaurant_count"],
                "first_review_at": row["first_review_at"].isoformat()
                if row["first_review_at"]
                else None,
                "last_review_at": row["last_review_at"].isoformat()
                if row["last_review_at"]
                else None,
            }
            for row in reviewer_rows
        ]

    def _build_rating_progress(self, reviews: list[Review]) -> list[dict]:
        monthly_ratings: dict[str, list[int]] = defaultdict(list)
        for review in reviews:
            month = review.created_at.date().replace(day=1).isoformat()
            monthly_ratings[month].append(review.rating)

        progress = []
        cumulative_ratings = []
        for month in sorted(monthly_ratings):
            month_ratings = monthly_ratings[month]
            cumulative_ratings.extend(month_ratings)
            progress.append(
                {
                    "month": month,
                    "review_count": len(month_ratings),
                    "average_rating": self._round_rating(
                        sum(month_ratings) / len(month_ratings)
                    ),
                    "cumulative_review_count": len(cumulative_ratings),
                    "cumulative_average_rating": self._round_rating(
                        sum(cumulative_ratings) / len(cumulative_ratings)
                    ),
                }
            )

        return progress

    def _average_rating(self, reviews: list[Review]) -> float | None:
        if not reviews:
            return None
        return self._round_rating(sum(review.rating for review in reviews) / len(reviews))

    def _round_rating(self, value) -> float | None:
        if value is None:
            return None
        return round(float(value), 2)
