from django.urls import path

from reviews.views import RestaurantReviewsController
from restaurants.views import RestaurantDetailController, OwnerRestaurantsController, RestaurantsController

urlpatterns = [
    path("", RestaurantsController.as_view(), name="restaurants-list"),
    path("mine/", OwnerRestaurantsController.as_view(), name="restaurants-mine"),
    path(
        "<slug:restaurant_slug>/reviews/",
        RestaurantReviewsController.as_view(),
        name="restaurants-reviews",
    ),
    path("<slug:slug>/", RestaurantDetailController.as_view(), name="restaurants-detail"),
]
