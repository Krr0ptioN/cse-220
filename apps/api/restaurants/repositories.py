"""Restaurant data access layer."""

from restaurants.models import Restaurant


class RestaurantRepository:
    """Repository for restaurant persistence and queries."""

    def list_restaurants(self):
        return Restaurant.objects.select_related("category").all()

    def get_by_slug(self, slug: str):
        return Restaurant.objects.select_related("category", "owner").filter(slug=slug).first()

    def create(self, *, owner, data: dict) -> Restaurant:
        return Restaurant.objects.create(owner=owner, **data)

    def save(self, restaurant: Restaurant, data: dict) -> Restaurant:
        for field, value in data.items():
            setattr(restaurant, field, value)
        restaurant.save()
        return restaurant

    def delete(self, restaurant: Restaurant) -> None:
        restaurant.delete()
