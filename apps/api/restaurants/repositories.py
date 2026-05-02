from restaurants.models import Category, MenuItem, Restaurant, OpeningHour

class RestaurantRepository:
    """Repository for restaurant persistence and queries."""

    def list_restaurants(self):
        return Restaurant.objects.select_related("category").all()

    def list_categories(self):
        return Category.objects.all()

    def list_by_owner(self, owner):
        return Restaurant.objects.select_related("category").filter(owner=owner)

    def get_by_slug(self, slug: str):
        return Restaurant.objects.select_related("category", "owner").prefetch_related("opening_hours").filter(slug=slug).first()

    def create(self, *, owner, data: dict) -> Restaurant:
        return Restaurant.objects.create(owner=owner, **data)

    def save(self, restaurant: Restaurant, data: dict) -> Restaurant:
        for field, value in data.items():
            setattr(restaurant, field, value)
        restaurant.save()
        return restaurant

    def delete(self, restaurant: Restaurant) -> None:
        restaurant.delete()

    def delete_opening_hours(self, restaurant: Restaurant) -> None:
        restaurant.opening_hours.all().delete()

    def bulk_create_opening_hours(self, opening_hours: list[OpeningHour]) -> list[OpeningHour]:
        return OpeningHour.objects.bulk_create(opening_hours)