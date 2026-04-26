"""Restaurant application services."""

from api.exceptions import ApiError
from restaurants.repositories import RestaurantRepository
from users.models import UserRole


class RestaurantService:
    """Coordinates restaurant endpoint behavior."""

    repository_class = RestaurantRepository

    def __init__(self, repository: RestaurantRepository | None = None) -> None:
        self.repository = repository or self.repository_class()

    def list_restaurants(self):
        return self.repository.list_restaurants()

    def list_categories(self):
        return self.repository.list_categories()

    def list_owned_restaurants(self, user):
        if user.role != UserRole.OWNER:
            raise ApiError(
                status_code=403,
                code="forbidden",
                detail="You do not have permission to manage restaurants.",
            )
        return self.repository.list_by_owner(user)

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
        return self.repository.create(owner=user, data=data)

    def update_restaurant(self, *, user, restaurant, data: dict):
        if user.role != UserRole.OWNER or restaurant.owner_id != user.id:
            raise ApiError(
                status_code=403,
                code="forbidden",
                detail="You do not have permission to update this restaurant.",
            )
        return self.repository.save(restaurant, data)

    def delete_restaurant(self, *, user, restaurant) -> None:
        if user.role != UserRole.ADMIN:
            raise ApiError(
                status_code=403,
                code="forbidden",
                detail="You do not have permission to delete this restaurant.",
            )
        self.repository.delete(restaurant)
