"""Architecture tests for the DRF controller/service/repository layers."""

from api.urls import urlpatterns as api_urlpatterns
from django.conf import settings
from restaurants.urls import urlpatterns as restaurant_urlpatterns
from reviews.urls import urlpatterns as review_urlpatterns
from users.urls import urlpatterns as user_urlpatterns


def _view_class(urlpatterns, route: str):
    for pattern in urlpatterns:
        if str(pattern.pattern) == route:
            return pattern.callback.view_class
    raise AssertionError(f"Route {route!r} not found")


def test_urls_are_backed_by_drf_controller_classes():
    assert _view_class(api_urlpatterns, "").__name__ == "HealthController"
    assert _view_class(user_urlpatterns, "me/").__name__ == "UsersController"
    assert _view_class(restaurant_urlpatterns, "").__name__ == "RestaurantsController"
    assert _view_class(restaurant_urlpatterns, "mine/dashboard/").__name__ == "OwnerDashboardController"
    assert _view_class(restaurant_urlpatterns, "<slug:slug>/").__name__ == "RestaurantDetailController"
    assert _view_class(restaurant_urlpatterns, "<slug:restaurant_slug>/menu-items/").__name__ == "RestaurantMenuItemsController"
    assert _view_class(restaurant_urlpatterns, "<slug:restaurant_slug>/menu-items/<uuid:menu_item_id>/").__name__ == "RestaurantMenuItemDetailController"
    assert _view_class(review_urlpatterns, "restaurants/<slug:restaurant_slug>/").__name__ == "RestaurantReviewsController"
    assert _view_class(review_urlpatterns, "<uuid:review_id>/").__name__ == "ReviewController"
    assert _view_class(review_urlpatterns, "<uuid:review_id>/like/").__name__ == "ReviewLikeController"
    assert _view_class(review_urlpatterns, "<uuid:review_id>/dislike/").__name__ == "ReviewDislikeController"
    assert _view_class(review_urlpatterns, "<uuid:review_id>/replies/").__name__ == "ReviewRepliesController"


def test_wireup_is_configured_for_api_modules():
    assert settings.WIREUP.auto_inject_views is False
    assert settings.WIREUP.injectables == [
        "api.services",
        "api.policies",
        "users.repositories",
        "users.services",
        "restaurants.repositories",
        "restaurants.search.geospatial",
        "restaurants.filter_parser",
        "restaurants.discovery_service",
        "restaurants.ownership_service",
        "restaurants.management_service",
        "restaurants.favorites_service",
        "restaurants.services",
        "reviews.repositories",
        "reviews.services",
        "files.repositories",
        "files.services",
    ]


def test_drf_uses_session_authentication_only():
    assert settings.REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] == [
        "rest_framework.authentication.SessionAuthentication"
    ]
