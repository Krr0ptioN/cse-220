"""Shared helpers for restaurant services."""

from __future__ import annotations

from abc import ABC, abstractmethod
from django.utils import timezone

from api.exceptions import ApiError
from api.policies import AccessPolicyManager
from files.services import FileService
from restaurants.contracts import RestaurantRepositoryContract
from restaurants.models import Favorite, Restaurant
from restaurants.repositories import RestaurantRepository


class RestaurantServiceBase(ABC):
    """Common dependency and guard behavior for restaurant services."""

    def __init__(
        self,
        repository: RestaurantRepository | None = None,
        file_service: FileService | None = None,
    ) -> None:
        self.repository: RestaurantRepositoryContract = repository or RestaurantRepository()
        self.file_service = file_service or FileService()
        self.policies = AccessPolicyManager()

    @property
    @abstractmethod
    def service_name(self) -> str:
        """Return a stable name for this service group."""

    def _require_owner(self, user, *, detail: str) -> None:
        if not self.policies.can_create_restaurant(user).allowed:
            raise ApiError(status_code=403, code="forbidden", detail=detail)

    def _require_admin(self, user, *, detail: str) -> None:
        if not self.policies.can_delete_any_restaurant(user).allowed:
            raise ApiError(status_code=403, code="forbidden", detail=detail)

    def _require_menu_manager(self, *, user, restaurant: Restaurant) -> None:
        decision = self.policies.can_manage_restaurant_menu(user, restaurant)
        if not decision.allowed:
            raise ApiError(status_code=403, code="forbidden", detail=decision.reason)

    def _get_restaurant_or_not_found(self, slug: str) -> Restaurant:
        restaurant = self.repository.get_by_slug(slug)
        if restaurant is None:
            raise ApiError(status_code=404, code="not_found", detail="Restaurant not found.")
        return restaurant

    def _get_menu_item_or_not_found(self, *, restaurant: Restaurant, menu_item_id):
        menu_item = self.repository.get_menu_item(
            restaurant=restaurant,
            menu_item_id=menu_item_id,
        )
        if menu_item is None:
            raise ApiError(status_code=404, code="not_found", detail="Menu item not found.")
        return menu_item

    def _get_photo_or_not_found(self, *, restaurant: Restaurant, photo_id):
        photo = self.repository.get_photo(restaurant=restaurant, photo_id=photo_id)
        if photo is None:
            raise ApiError(status_code=404, code="not_found", detail="Photo not found.")
        return photo

    def _get_restaurant_for_update(self, slug: str) -> Restaurant:
        restaurant = self.repository.get_by_slug(slug)
        if restaurant is None:
            raise ApiError(status_code=404, code="not_found", detail="Restaurant not found.")
        return restaurant

    def _refresh_favorite_metrics(self, restaurant: Restaurant) -> Restaurant:
        favorite_count = Favorite.objects.filter(restaurant=restaurant).count()
        last_favorited_at = (
            Favorite.objects.filter(restaurant=restaurant)
            .order_by("-created_at")
            .values_list("created_at", flat=True)
            .first()
        )
        refreshed_last_favorited_at = last_favorited_at or timezone.now() if favorite_count else None
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
