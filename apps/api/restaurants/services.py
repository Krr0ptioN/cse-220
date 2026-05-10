"""Compatibility facade for restaurant services."""

from __future__ import annotations

from wireup import injectable

from restaurants.discovery_service import RestaurantDiscoveryService
from restaurants.favorites_service import RestaurantFavoritesService
from restaurants.management_service import RestaurantManagementService
from restaurants.ownership_service import RestaurantOwnershipService


@injectable
class RestaurantService:
    """Compatibility facade that delegates to focused restaurant services."""

    def __init__(
        self,
        discovery_service: RestaurantDiscoveryService | None = None,
        management_service: RestaurantManagementService | None = None,
        favorites_service: RestaurantFavoritesService | None = None,
        ownership_service: RestaurantOwnershipService | None = None,
    ) -> None:
        self.discovery_service = discovery_service or RestaurantDiscoveryService()
        self.management_service = management_service or RestaurantManagementService()
        self.favorites_service = favorites_service or RestaurantFavoritesService()
        self.ownership_service = ownership_service or RestaurantOwnershipService()

    @property
    def file_service(self):
        return self.management_service.file_service

    def list_restaurants(self, filters: dict | None = None, sort: str | None = None):
        return self.discovery_service.list_restaurants(filters=filters, sort=sort)

    def list_favorite_restaurants(self, user, filters: dict | None = None, sort: str | None = None):
        return self.discovery_service.list_favorite_restaurants(user=user, filters=filters, sort=sort)

    def list_categories(self):
        return self.discovery_service.list_categories()

    def get_homepage_sections(self, *, limit: int = 5):
        return self.discovery_service.get_homepage_sections(limit=limit)

    def list_owned_restaurants(self, user):
        return self.ownership_service.list_owned_restaurants(user)

    def get_owner_dashboard(self, user):
        return self.ownership_service.get_owner_dashboard(user)

    def get_restaurant(self, slug: str):
        return self.management_service.get_restaurant(slug)

    def create_restaurant(self, *, user, data: dict):
        return self.management_service.create_restaurant(user=user, data=data)

    def update_restaurant(self, *, user, restaurant, data: dict):
        return self.management_service.update_restaurant(user=user, restaurant=restaurant, data=data)

    def delete_restaurant(self, *, user, restaurant) -> None:
        self.management_service.delete_restaurant(user=user, restaurant=restaurant)

    def list_menu_items(self, restaurant):
        return self.management_service.list_menu_items(restaurant)

    def list_photos(self, *, restaurant):
        return self.management_service.list_photos(restaurant=restaurant)

    def upload_photos(self, *, user, restaurant, uploaded_files):
        return self.management_service.upload_photos(
            user=user,
            restaurant=restaurant,
            uploaded_files=uploaded_files,
        )

    def set_primary_photo(self, *, user, restaurant, photo_id):
        return self.management_service.set_primary_photo(
            user=user,
            restaurant=restaurant,
            photo_id=photo_id,
        )

    def delete_photo(self, *, user, restaurant, photo_id) -> None:
        self.management_service.delete_photo(user=user, restaurant=restaurant, photo_id=photo_id)

    def get_menu_item(self, *, restaurant, menu_item_id):
        return self.management_service.get_menu_item(
            restaurant=restaurant,
            menu_item_id=menu_item_id,
        )

    def create_menu_item(self, *, user, restaurant, data: dict):
        return self.management_service.create_menu_item(user=user, restaurant=restaurant, data=data)

    def update_menu_item(self, *, user, restaurant, menu_item, data: dict):
        return self.management_service.update_menu_item(
            user=user,
            restaurant=restaurant,
            menu_item=menu_item,
            data=data,
        )

    def delete_menu_item(self, *, user, restaurant, menu_item) -> None:
        self.management_service.delete_menu_item(
            user=user,
            restaurant=restaurant,
            menu_item=menu_item,
        )

    def favorite_restaurant(self, user, restaurant_slug: str):
        return self.favorites_service.favorite_restaurant(user, restaurant_slug)

    def unfavorite_restaurant(self, user, restaurant_slug: str):
        return self.favorites_service.unfavorite_restaurant(user, restaurant_slug)
