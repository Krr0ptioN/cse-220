"""Restaurant favorites service."""

from __future__ import annotations

from django.db import IntegrityError, transaction
from wireup import injectable

from api.exceptions import ApiError
from restaurants.models import Favorite
from restaurants.repositories import RestaurantRepository
from restaurants.service_base import RestaurantServiceBase


@injectable
class RestaurantFavoritesService(RestaurantServiceBase):
    """Coordinates favorite and unfavorite operations."""

    def __init__(self, repository: RestaurantRepository | None = None) -> None:
        super().__init__(repository=repository)

    @property
    def service_name(self) -> str:
        return "favorites"

    @transaction.atomic
    def favorite_restaurant(self, user, restaurant_slug: str):
        decision = self.policies.can_favorite_restaurant(user)
        if not decision.allowed:
            raise ApiError(status_code=403, code="forbidden", detail=decision.reason)

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
    def unfavorite_restaurant(self, user, restaurant_slug: str):
        decision = self.policies.can_favorite_restaurant(user)
        if not decision.allowed:
            raise ApiError(status_code=403, code="forbidden", detail=decision.reason)

        restaurant = self._get_restaurant_for_update(restaurant_slug)
        deleted_count, _ = Favorite.objects.filter(
            user=user,
            restaurant=restaurant,
        ).delete()

        return self._refresh_favorite_metrics(restaurant), deleted_count > 0
