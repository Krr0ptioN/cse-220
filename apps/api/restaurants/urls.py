from django.urls import path

from restaurants.views import RestaurantDetailController, RestaurantsController

urlpatterns = [
    path("", RestaurantsController.as_view(), name="restaurants-list"),
    path("<slug:slug>/", RestaurantDetailController.as_view(), name="restaurants-detail"),
]
