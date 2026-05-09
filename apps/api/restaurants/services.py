"""Restaurant application services."""
from restaurants.models import Favorite, Restaurant

from collections import defaultdict
from decimal import Decimal, InvalidOperation
from django.db import transaction, IntegrityError
from django.db.models import Avg, Count, Max, Min
from django.utils import timezone
from api.exceptions import ApiError
from files.services import create_file_service
from restaurants.serializers import RestaurantSerializer
from restaurants.repositories import RestaurantRepository
from reviews.models import Review
from users.models import UserRole


class RestaurantService:
    """Coordinates restaurant endpoint behavior."""

    repository_class = RestaurantRepository

    def __init__(self, repository: RestaurantRepository | None = None) -> None:
        self.repository = repository or self.repository_class()
        self.file_service = create_file_service()


    def list_restaurants(self, filters: dict | None = None, sort: str | None = None):
        normalized_filters = self._normalize_restaurant_filters(filters or {})
        return self.repository.list_restaurants(filters=normalized_filters, sort=sort)

    def list_favorite_restaurants(
        self,
        user,
        filters: dict | None = None,
        sort: str | None = None,
    ):
        normalized_filters = self._normalize_restaurant_filters(filters or {})

        return self.repository.list_favorite_restaurants(
            user=user,
            filters=normalized_filters,
            sort=sort,
        )

    def _normalize_restaurant_filters(self, filters: dict) -> dict:
        normalized: dict = {}

        category = filters.get("category")
        if category:
            normalized["category"] = str(category).strip().lower()

        city = filters.get("city")
        if city:
            normalized["city"] = str(city).strip()

        search = filters.get("search")
        if search:
            normalized["search"] = str(search).strip()

        price_range = filters.get("price_range") or filters.get("price")
        if price_range:
            price_range = str(price_range).strip()
            if price_range not in {"1", "2", "3"}:
                raise ApiError(
                    status_code=400,
                    code="invalid_filter",
                    detail="price must be one of: 1, 2, 3.",
                )
            normalized["price_range"] = price_range

        min_rating = filters.get("min_rating")
        if min_rating not in (None, ""):
            try:
                min_rating_value = Decimal(str(min_rating))
            except (InvalidOperation, ValueError):
                raise ApiError(
                    status_code=400,
                    code="invalid_filter",
                    detail="min_rating must be a number between 0 and 5.",
                ) from None

            if min_rating_value < 0 or min_rating_value > 5:
                raise ApiError(
                    status_code=400,
                    code="invalid_filter",
                    detail="min_rating must be a number between 0 and 5.",
                )

            normalized["min_rating"] = min_rating_value

        return normalized

    def list_categories(self):
        return self.repository.list_categories()

    def get_homepage_sections(self, *, limit: int = 5):
        return {
            "top_rated": list(self.repository.list_homepage_top_rated(limit=limit)),
            "newest": list(self.repository.list_homepage_newest(limit=limit)),
        }

    def list_owned_restaurants(self, user):
        if user.role != UserRole.OWNER:
            raise ApiError(
                status_code=403,
                code="forbidden",
                detail="You do not have permission to manage restaurants.",
            )
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

    def get_restaurant(self, slug: str):
        restaurant = self.repository.get_by_slug(slug)
        if restaurant is None:
            raise ApiError(status_code=404, code="not_found", detail="Restaurant not found.")
        return restaurant

    def create_restaurant(self, *, user, data: dict):
        if user.role != UserRole.OWNER:
            raise ApiError(
                status_code=403,
                code="forbidden",
                detail="You do not have permission to create a restaurant.",
            )

        categories = data.pop("categories", [])
        opening_hours = data.pop("opening_hours", [])
        primary_photo = data.pop("primary_photo", None)

        with transaction.atomic():
            restaurant = self.repository.create(owner=user, data=data)

            if categories:
                restaurant.categories.set(categories)

            if opening_hours:
                self.repository.set_opening_hours(restaurant, opening_hours)

            if primary_photo is not None:
                self._set_primary_photo(restaurant=restaurant, uploaded_file=primary_photo)

        return restaurant

    def update_restaurant(self, *, user, restaurant, data: dict):
        if user.role != UserRole.OWNER or restaurant.owner_id != user.id:
            raise ApiError(
                status_code=403,
                code="forbidden",
                detail="You do not have permission to update this restaurant.",
            )

        categories = data.pop("categories", None)
        opening_hours = data.pop("opening_hours", None)
        primary_photo = data.pop("primary_photo", None)

        with transaction.atomic():
            updated_restaurant = self.repository.save(restaurant, data)

            if categories is not None:
                updated_restaurant.categories.set(categories)

            if opening_hours is not None:
                self.repository.set_opening_hours(updated_restaurant, opening_hours)

            if primary_photo is not None:
                self._set_primary_photo(
                    restaurant=updated_restaurant,
                    uploaded_file=primary_photo,
                )

        return updated_restaurant

    def delete_restaurant(self, *, user, restaurant) -> None:
        if user.role != UserRole.ADMIN:
            raise ApiError(
                status_code=403,
                code="forbidden",
                detail="You do not have permission to delete this restaurant.",
            )
        self._delete_primary_photo(restaurant)
        self.repository.delete(restaurant)

    def list_menu_items(self, restaurant):
        return self.repository.list_menu_items(restaurant)

    def get_menu_item(self, *, restaurant, menu_item_id):
        menu_item = self.repository.get_menu_item(
            restaurant=restaurant,
            menu_item_id=menu_item_id,
        )
        if menu_item is None:
            raise ApiError(status_code=404, code="not_found", detail="Menu item not found.")
        return menu_item

    def create_menu_item(self, *, user, restaurant, data: dict):
        self._require_menu_manager(user=user, restaurant=restaurant)
        return self.repository.create_menu_item(restaurant=restaurant, data=data)

    def update_menu_item(self, *, user, restaurant, menu_item, data: dict):
        self._require_menu_manager(user=user, restaurant=restaurant)
        return self.repository.save_menu_item(menu_item, data)

    def delete_menu_item(self, *, user, restaurant, menu_item) -> None:
        self._require_menu_manager(user=user, restaurant=restaurant)
        self.repository.delete_menu_item(menu_item)

    def _require_menu_manager(self, *, user, restaurant) -> None:
        if user.role == UserRole.ADMIN:
            return
        if user.role == UserRole.OWNER and restaurant.owner_id == user.id:
            return
        raise ApiError(
            status_code=403,
            code="forbidden",
            detail="You do not have permission to manage this restaurant menu.",
        )

    def _set_primary_photo(self, *, restaurant, uploaded_file) -> None:
        previous_photo_id = restaurant.primary_photo_id
        stored_file_id = None

        try:
            stored_file_id, _ = self.file_service.save(
                uploaded_file,
                category="restaurants",
                entity_id=str(restaurant.id),
                content_type=getattr(uploaded_file, "content_type", "application/octet-stream"),
            )
            restaurant.primary_photo_id = stored_file_id
            restaurant.save(update_fields=["primary_photo", "updated_at"])
        except Exception:
            if stored_file_id is not None:
                self.file_service.delete_by_id(stored_file_id)
            raise

        if previous_photo_id and previous_photo_id != stored_file_id:
            self.file_service.delete_by_id(previous_photo_id)

    def _delete_primary_photo(self, restaurant) -> None:
        if restaurant.primary_photo_id:
            self.file_service.delete_by_id(restaurant.primary_photo_id)

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

        restaurant_data = RestaurantSerializer(restaurants, many=True).data
        dashboard_restaurants = []
        for restaurant, serialized in zip(restaurants, restaurant_data, strict=False):
            restaurant_reviews = reviews_by_restaurant[restaurant.id]
            dashboard_restaurants.append(
                {
                    **serialized,
                    "average_rating": self._average_rating(restaurant_reviews),
                    "review_count": len(restaurant_reviews),
                    "reviewer_stats": self._build_reviewer_stats(restaurant_reviews),
                    "rating_progress": self._build_rating_progress(restaurant_reviews),
                }
            )

        return dashboard_restaurants

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


    def _refresh_favorite_metrics(self, restaurant: Restaurant) -> Restaurant:
        favorite_count = Favorite.objects.filter(restaurant=restaurant).count()
        last_favorited_at = (
            Favorite.objects.filter(restaurant=restaurant)
            .order_by("-created_at")
            .values_list("created_at", flat=True)
            .first()
        )
        refreshed_last_favorited_at = (
            last_favorited_at or timezone.now() if favorite_count else None
        )
        if (
            restaurant.favorite_count == favorite_count
            and restaurant.favorite_score == favorite_count
            and restaurant.last_favorited_at == refreshed_last_favorited_at
        ):
            return restaurant
        restaurant.favorite_count = favorite_count
        restaurant.favorite_score = favorite_count
        restaurant.last_favorited_at = refreshed_last_favorited_at
        restaurant.save(
            update_fields=[
                "favorite_count",
                "favorite_score",
                "last_favorited_at",
                "updated_at",
            ]
        )
        return restaurant


    @transaction.atomic
    def favorite_restaurant(self, user, restaurant_slug: str) -> tuple[Restaurant, bool]:
        restaurant = self._get_restaurant_for_update(restaurant_slug)

        try:
            favorite, created = Favorite.objects.get_or_create(
                user=user,
                restaurant=restaurant,
            )
            return self._refresh_favorite_metrics(favorite.restaurant), created
        except IntegrityError:
            favorite = Favorite.objects.select_related("restaurant").get(
                user=user,
                restaurant=restaurant,
            )
            return self._refresh_favorite_metrics(favorite.restaurant), False

    @transaction.atomic
    def unfavorite_restaurant(self, user, restaurant_slug: str) -> tuple[Restaurant, bool]:
        restaurant = self._get_restaurant_for_update(restaurant_slug)
        deleted_count, _ = Favorite.objects.filter(
            user=user,
            restaurant=restaurant,
        ).delete()

        return self._refresh_favorite_metrics(restaurant), deleted_count > 0

    def _get_restaurant_for_update(self, slug: str) -> Restaurant:
        restaurant = (
            Restaurant.objects.select_for_update()
            .select_related("owner")
            .prefetch_related("categories", "opening_hours")
            .filter(slug=slug)
            .first()
        )
        if restaurant is None:
            raise ApiError(status_code=404, code="not_found", detail="Restaurant not found.")
        return restaurant
