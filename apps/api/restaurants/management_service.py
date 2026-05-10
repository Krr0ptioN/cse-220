"""Restaurant management service."""

from __future__ import annotations

from django.db import transaction
from wireup import injectable

from api.exceptions import ApiError
from files.services import FileService
from restaurants.repositories import RestaurantRepository
from restaurants.service_base import RestaurantServiceBase


@injectable
class RestaurantManagementService(RestaurantServiceBase):
    """Coordinates restaurant CRUD, menu, and photo management."""

    def __init__(
        self,
        repository: RestaurantRepository | None = None,
        file_service: FileService | None = None,
    ) -> None:
        super().__init__(repository=repository, file_service=file_service)

    @property
    def service_name(self) -> str:
        return "management"

    def get_restaurant(self, slug: str):
        return self._get_restaurant_or_not_found(slug)

    def create_restaurant(self, *, user, data: dict):
        decision = self.policies.can_create_restaurant(user)
        if not decision.allowed:
            raise ApiError(status_code=403, code="forbidden", detail=decision.reason)

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
        decision = self.policies.can_update_restaurant(user, restaurant)
        if not decision.allowed:
            raise ApiError(status_code=403, code="forbidden", detail=decision.reason)

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
        decision = self.policies.can_delete_restaurant(user, restaurant)
        if not decision.allowed:
            raise ApiError(status_code=403, code="forbidden", detail=decision.reason)
        self._delete_primary_photo(restaurant)
        self.repository.delete(restaurant)

    def list_menu_items(self, restaurant):
        return self.repository.list_menu_items(restaurant)

    def list_photos(self, *, restaurant):
        return self.repository.list_photos(restaurant)

    def upload_photos(self, *, user, restaurant, uploaded_files):
        self._require_menu_manager(user=user, restaurant=restaurant)
        photos = []
        next_sort_order = self.repository.list_photos(restaurant).count()

        with transaction.atomic():
            for index, uploaded_file in enumerate(uploaded_files):
                stored_file_id, _ = self.file_service.save(
                    uploaded_file,
                    category="restaurants",
                    entity_id=str(restaurant.id),
                    content_type=getattr(uploaded_file, "content_type", "application/octet-stream"),
                    generate_thumbnails=True,
                )
                photo = self.repository.create_photo(
                    restaurant=restaurant,
                    file_id=stored_file_id,
                    sort_order=next_sort_order + index,
                )
                photos.append(photo)

                if restaurant.primary_photo_id is None and index == 0:
                    restaurant.primary_photo_id = stored_file_id
                    restaurant.save(update_fields=["primary_photo", "updated_at"])

        return photos

    def set_primary_photo(self, *, user, restaurant, photo_id):
        self._require_menu_manager(user=user, restaurant=restaurant)
        photo = self._get_photo_or_not_found(restaurant=restaurant, photo_id=photo_id)

        restaurant.primary_photo_id = photo.file_id
        restaurant.save(update_fields=["primary_photo", "updated_at"])
        return restaurant

    def delete_photo(self, *, user, restaurant, photo_id) -> None:
        self._require_menu_manager(user=user, restaurant=restaurant)
        photo = self._get_photo_or_not_found(restaurant=restaurant, photo_id=photo_id)

        file_id = photo.file_id
        was_primary = restaurant.primary_photo_id == file_id
        self.repository.delete_photo(photo)

        if was_primary:
            next_photo = self.repository.list_photos(restaurant).first()
            restaurant.primary_photo_id = next_photo.file_id if next_photo else None
            restaurant.save(update_fields=["primary_photo", "updated_at"])

        self.file_service.delete_by_id(file_id)

    def get_menu_item(self, *, restaurant, menu_item_id):
        return self._get_menu_item_or_not_found(restaurant=restaurant, menu_item_id=menu_item_id)

    def create_menu_item(self, *, user, restaurant, data: dict):
        self._require_menu_manager(user=user, restaurant=restaurant)
        return self.repository.create_menu_item(restaurant=restaurant, data=data)

    def update_menu_item(self, *, user, restaurant, menu_item, data: dict):
        self._require_menu_manager(user=user, restaurant=restaurant)
        return self.repository.save_menu_item(menu_item, data)

    def delete_menu_item(self, *, user, restaurant, menu_item) -> None:
        self._require_menu_manager(user=user, restaurant=restaurant)
        self.repository.delete_menu_item(menu_item)

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
