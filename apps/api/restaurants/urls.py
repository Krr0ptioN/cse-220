from django.urls import path

from reviews.views import RestaurantReviewsController
from restaurants.views import (
    RestaurantDetailController, 
    OwnerRestaurantsController, 
    RestaurantsController,
    RestaurantOpeningHoursController,
    RestaurantMenuItemsController,
    FavoriteController
)

urlpatterns = [
    path("", RestaurantsController.as_view(), name="restaurants-list"),
    path("mine/", OwnerRestaurantsController.as_view(), name="restaurants-mine"),
    path(
        "<slug:restaurant_slug>/reviews/",
        RestaurantReviewsController.as_view(),
        name="restaurants-reviews",
    ),
    path(
        "<slug:slug>/opening-hours/",
        RestaurantOpeningHoursController.as_view(),
        name="restaurant-opening-hours"
    ),
    path(
        "<slug:slug>/menu/",
        RestaurantMenuItemsController.as_view(),
        name="restaurant-menu-items"
    ),
    path(
        "<slug:slug>/favorite/",
        FavoriteController.as_view(),
        name="restaurant-favorite"
    ),
    path("<slug:slug>/", RestaurantDetailController.as_view(), name="restaurants-detail"),
]