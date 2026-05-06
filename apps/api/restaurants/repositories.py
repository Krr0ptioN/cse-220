"Repository for restaurant data access."""

<<<<<<< HEAD
from django.db.models import QuerySet
from restaurants.models import Category, MenuItem, Restaurant
=======
from restaurants.models import Category, MenuItem, OpeningHour, Restaurant
>>>>>>> 5223deffb887874a029cfebed6de59eaf889ced2


class RestaurantRepository:
    """Encapsulates database access for restaurants."""

    def list_restaurants(self, price_range=None) -> QuerySet[Restaurant]:
        """Lists all restaurants with optional price range filtering."""
        # Mardin'in opening_hours ve categories optimizasyonlarını koruduk
        queryset = Restaurant.objects.prefetch_related("categories", "opening_hours").all()
        
        # Senin eklediğin fiyat filtresi
        if price_range:
            queryset = queryset.filter(price_range=price_range)
            
        return queryset
    def list_restaurants(self):
        return Restaurant.objects.prefetch_related("categories", "opening_hours").all()

    def list_categories(self) -> QuerySet[Category]:
        """Returns all available restaurant categories."""
        return Category.objects.all()

<<<<<<< HEAD
    def list_by_owner(self, owner) -> QuerySet[Restaurant]:
        """Returns restaurants owned by a specific user."""
        return Restaurant.objects.filter(owner=owner).prefetch_related("categories")

    def get_by_slug(self, slug: str) -> Restaurant | None:
        """Fetches a single restaurant by its slug."""
        try:
            return Restaurant.objects.get(slug=slug)
        except Restaurant.DoesNotExist:
            return None
=======
    def list_by_owner(self, owner):
        return Restaurant.objects.prefetch_related("categories", "opening_hours").filter(owner=owner)

    def get_by_slug(self, slug: str):
        return (
            Restaurant.objects.select_related("owner")
            .prefetch_related("categories", "opening_hours")
            .filter(slug=slug)
            .first()
        )
>>>>>>> 5223deffb887874a029cfebed6de59eaf889ced2

    def create(self, *, owner, data: dict) -> Restaurant:
        """Creates a new restaurant instance."""
        categories = data.pop("category_ids", [])
        restaurant = Restaurant.objects.create(owner=owner, **data)
        if categories:
            restaurant.categories.set(categories)
        return restaurant

    def save(self, restaurant: Restaurant, data: dict) -> Restaurant:
        """Updates an existing restaurant instance."""
        categories = data.pop("category_ids", None)
        for attr, value in data.items():
            setattr(restaurant, attr, value)
        restaurant.save()
        if categories is not None:
            restaurant.categories.set(categories)
        return restaurant

    def delete(self, restaurant: Restaurant) -> None:
        """Deletes a restaurant instance."""
        restaurant.delete()

    def list_menu_items(self, restaurant: Restaurant) -> QuerySet[MenuItem]:
        """Lists all menu items for a specific restaurant."""
        return MenuItem.objects.filter(restaurant=restaurant).select_related("category")

    def get_menu_item(self, *, restaurant: Restaurant, menu_item_id: str) -> MenuItem | None:
        """Fetches a specific menu item for a restaurant."""
        try:
            return MenuItem.objects.get(restaurant=restaurant, id=menu_item_id)
        except MenuItem.DoesNotExist:
            return None

    def create_menu_item(self, *, restaurant: Restaurant, data: dict) -> MenuItem:
        """Creates a new menu item for a restaurant."""
        return MenuItem.objects.create(restaurant=restaurant, **data)

    def save_menu_item(self, menu_item: MenuItem, data: dict) -> MenuItem:
        """Updates an existing menu item."""
        for attr, value in data.items():
            setattr(menu_item, attr, value)
        menu_item.save()
        return menu_item

    def delete_menu_item(self, menu_item: MenuItem) -> None:
<<<<<<< HEAD
        """Deletes a menu item."""
        menu_item.delete()
=======
        menu_item.delete()

    def set_opening_hours(self, restaurant, hours_data: list):
        OpeningHour.objects.filter(restaurant=restaurant).delete()
        hours = [
            OpeningHour(restaurant=restaurant, **hour)
            for hour in hours_data
        ]
        return OpeningHour.objects.bulk_create(hours)
>>>>>>> 5223deffb887874a029cfebed6de59eaf889ced2
