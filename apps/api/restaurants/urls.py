from django.urls import path

from restaurants.views import (
    OwnerDashboardController,
    OwnerRestaurantsController,
    RestaurantDetailController,
    RestaurantHomepageController,
    RestaurantMenuItemDetailController,
    RestaurantMenuItemsController,
    RestaurantsController
)

from reviews.views import RestaurantReviewsController

from .controllers import (
    ReviewerFavoriteRestaurantListController,
    ReviewerFavoriteRestaurantController
) 

urlpatterns = [
    path("", RestaurantsController.as_view(), name="restaurants-list"),
    path("homepage/", RestaurantHomepageController.as_view(), name="restaurants-homepage"),
    path(
        "favorites/",
        ReviewerFavoriteRestaurantListController.as_view(),
        name="reviewer-favorite-restaurants-list",
    ),
    path(
        "<slug:restaurant_slug>/favorite/",
        ReviewerFavoriteRestaurantController.as_view(),
        name="reviewer-restaurant-favorite",
    ),
    path(
        "mine/dashboard/",
        OwnerDashboardController.as_view(),
        name="restaurants-mine-dashboard",
    ),
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
    path(
        "<slug:slug>/", 
        RestaurantDetailController.as_view(),
        name="restaurants-detail"
    ),
]
