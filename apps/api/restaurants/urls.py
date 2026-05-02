from django.urls import path
from reviews.views import RestaurantReviewsController
from restaurants.views import (
    RestaurantDetailController,
    OwnerRestaurantsController,
    RestaurantsController,
    RestaurantOpeningHoursController,
    RestaurantMenuItemsController,
    RestaurantMenuItemDetailController,
    FavoriteController,
    CategoryListController,
)

urlpatterns = [
    path("", RestaurantsController.as_view(), name="restaurants-list"),
    # Testler kategorileri direkt bu yolda beklediği için buraya aldık
    path("categories/", CategoryListController.as_view(), name="restaurants-categories"),
    path("mine/", OwnerRestaurantsController.as_view(), name="restaurants-mine"),
    path("<slug:restaurant_slug>/reviews/", RestaurantReviewsController.as_view(), name="restaurants-reviews"),
    path("<slug:slug>/opening-hours/", RestaurantOpeningHoursController.as_view(), name="restaurants-opening-hours"),
    # Testler /menu/ değil /menu-items/ beklediği için test uyumlu hale getirdik
    path("<slug:slug>/menu-items/", RestaurantMenuItemsController.as_view(), name="restaurants-menu-items"),
    path("<slug:slug>/menu-items/<uuid:menu_item_id>/", RestaurantMenuItemDetailController.as_view(), name="restaurants-menu-item-detail"),
    path("<slug:slug>/favorite/", FavoriteController.as_view(), name="restaurants-favorite"),
    path("<slug:slug>/", RestaurantDetailController.as_view(), name="restaurants-detail"),
]