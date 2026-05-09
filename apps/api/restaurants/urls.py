from django.urls import path

from .controllers import (
    OwnerDashboardController,
    OwnerRestaurantsController,
    RestaurantDetailController,
    RestaurantHomepageController,
    RestaurantPhotoDetailController,
    RestaurantPhotoPrimaryController,
    RestaurantPhotosController,
    RestaurantMenuItemDetailController,
    RestaurantMenuItemsController,
    ReviewerFavoriteRestaurantListController,
    ReviewerFavoriteRestaurantController,
    RestaurantsController
)

from reviews.views import RestaurantReviewsController

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
        "<slug:restaurant_slug>/photos/",
        RestaurantPhotosController.as_view(),
        name="restaurants-photos",
    ),
    path(
        "<slug:restaurant_slug>/photos/<uuid:photo_id>/",
        RestaurantPhotoDetailController.as_view(),
        name="restaurants-photo-detail",
    ),
    path(
        "<slug:restaurant_slug>/photos/<uuid:photo_id>/primary/",
        RestaurantPhotoPrimaryController.as_view(),
        name="restaurants-photo-primary",
    ),
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
