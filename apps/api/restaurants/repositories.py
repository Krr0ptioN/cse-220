"""Restaurant data access layer."""

from wireup import injectable

from restaurants.query_builder import RestaurantQueryBuilder
from restaurants.models import Category, MenuItem, OpeningHour, Restaurant, RestaurantPhoto
from django.db import transaction

@injectable
class RestaurantRepository:
    """Repository for restaurant persistence and queries."""

    def list_restaurants(
        self,
        filters: dict | None = None,
        sort: str | None = None,
    ):
        return (
            RestaurantQueryBuilder()
            .with_related()
            .apply_filters(filters)
            .apply_sort(sort)
            .build()
        )

    def list_homepage_top_rated(self, *, limit: int = 5):
        return (
            Restaurant.objects.select_related("owner", "primary_photo")
            .prefetch_related("categories", "opening_hours", "photos")
            .order_by("-average_rating", "-review_count", "name")[:limit]
        )

    def list_homepage_newest(self, *, limit: int = 5):
        return (
            Restaurant.objects.select_related("owner", "primary_photo")
            .prefetch_related("categories", "opening_hours", "photos")
            .order_by("-created_at", "name")[:limit]
        )

    def list_categories(self):
        return Category.objects.all()

    def list_by_owner(self, owner):
        return Restaurant.objects.prefetch_related("categories", "opening_hours", "photos").filter(owner=owner)

    def get_by_slug(self, slug: str):
        return (
            Restaurant.objects.select_related("owner")
            .prefetch_related("categories", "opening_hours", "photos")
            .filter(slug=slug)
            .first()
        )

    def create(self, *, owner, data: dict) -> Restaurant:
        return Restaurant.objects.create(owner=owner, **data)

    def save(self, restaurant: Restaurant, data: dict) -> Restaurant:
        for field, value in data.items():
            setattr(restaurant, field, value)
        restaurant.save()
        return restaurant

    def delete(self, restaurant: Restaurant) -> None:
        restaurant.delete()

    def list_menu_items(self, restaurant):
        return MenuItem.objects.filter(restaurant=restaurant).select_related("restaurant", "category", "image")

    def get_menu_item(self, *, restaurant, menu_item_id):
        return (
            MenuItem.objects.filter(id=menu_item_id, restaurant=restaurant)
            .select_related("restaurant", "category", "image")
            .first()
        )

    def create_menu_item(self, *, restaurant, data: dict) -> MenuItem:
        return MenuItem.objects.create(restaurant=restaurant, **data)

    def save_menu_item(self, menu_item: MenuItem, data: dict) -> MenuItem:
        for field, value in data.items():
            setattr(menu_item, field, value)
        menu_item.save()
        return menu_item

    def delete_menu_item(self, menu_item: MenuItem) -> None:
        menu_item.delete()

    def list_photos(self, restaurant):
        return RestaurantPhoto.objects.filter(restaurant=restaurant).select_related("restaurant", "file")

    def create_photo(self, *, restaurant, file_id, sort_order: int = 0) -> RestaurantPhoto:
        return RestaurantPhoto.objects.create(
            restaurant=restaurant,
            file_id=file_id,
            sort_order=sort_order,
        )

    def get_photo(self, *, restaurant, photo_id):
        return (
            RestaurantPhoto.objects.filter(id=photo_id, restaurant=restaurant)
            .select_related("restaurant", "file")
            .first()
        )

    def delete_photo(self, photo: RestaurantPhoto) -> None:
        photo.delete()

    def set_opening_hours(self, restaurant, hours_data: list):
        with transaction.atomic(): 
            OpeningHour.objects.filter(restaurant=restaurant).delete()
            hours = [
                OpeningHour(restaurant=restaurant, **hour)
                for hour in hours_data
            ]
            return OpeningHour.objects.bulk_create(hours)

    def list_favorite_restaurants(
        self,
        user,
        filters: dict | None = None,
        sort: str | None = None,
    ):
        return (
            RestaurantQueryBuilder()
            .with_related()
            .favorites_for_user(user)
            .apply_filters(filters)
            .apply_sort(sort)
            .build()
        )
