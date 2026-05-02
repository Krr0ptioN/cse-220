from django.urls import path

from reviews.views import RestaurantReviewsController
from restaurants.views import (
    OwnerRestaurantsController,
    RestaurantDetailController,
    RestaurantMenuItemDetailController,
    RestaurantMenuItemsController,
    RestaurantsController,
)

urlpatterns = [
    path("", RestaurantsController.as_view(), name="restaurants-list"),
    path("mine/", OwnerRestaurantsController.as_view(), name="restaurants-mine"),
    path(
        "<slug:restaurant_slug>/menu-items/",
        RestaurantMenuItemsController.as_view(),
        name="restaurants-menu-items",
    ),
    path(
        "<slug:restaurant_slug>/menu-items/<uuid:menu_item_id>/",
        RestaurantMenuItemDetailController.as_view(),
        name="restaurants-menu-items-detail",
    ),
    path(
        "<slug:restaurant_slug>/reviews/",
        RestaurantReviewsController.as_view(),
        name="restaurants-reviews",
    ),
    path("<slug:slug>/", RestaurantDetailController.as_view(), name="restaurants-detail"),
]
