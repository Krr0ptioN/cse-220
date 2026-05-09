"""Tests for restaurant endpoints with guards and authentication."""

import pytest
from django.test import Client
from django.test.client import BOUNDARY, MULTIPART_CONTENT, encode_multipart
from django.test.utils import override_settings
from django.utils import timezone

from restaurants.models import Favorite, MenuItem, Restaurant
from users.models import UserRole
from tests.factories import (
    create_category as _create_category,
    create_review as _create_review,
    create_image_upload as _image_upload,
    create_restaurant as _create_restaurant,
    create_user as _create_user,
)

pytestmark = pytest.mark.django_db


def test_restaurant_create_accepts_primary_photo_upload(tmp_path):
    """POST /restaurants/ supports multipart restaurant photo uploads."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    category = _create_category()

    with override_settings(
        FILE_STORAGE_LOCAL_ROOT=str(tmp_path),
        FILE_STORAGE_LOCAL_URL="/media/",
    ):
        try:
            client.force_login(owner)
            response = client.generic(
                "POST",
                "/api/v1/restaurants/",
                data=encode_multipart(
                    BOUNDARY,
                    {
                        "name": "Ada Bistro",
                        "category_ids": [str(category.id)],
                        "description": "Seasonal plates",
                        "address_line1": "Main Street 1",
                        "city": "Istanbul",
                        "district": "Kadikoy",
                        "phone": "+90 555 0101",
                        "website": "https://ada.example.com",
                        "price_range": "2",
                        "primary_photo": _image_upload(),
                    },
                ),
                content_type=MULTIPART_CONTENT,
            )

            assert response.status_code == 201
            created = response.json()["data"]
            assert created["primary_photo_url"].startswith("/api/v1/files/")

            restaurant = Restaurant.objects.get(slug=created["slug"])
            assert restaurant.primary_photo_id is not None
        finally:
            owner.delete()
            category.delete()


def test_restaurant_update_replaces_primary_photo(tmp_path):
    """PATCH /restaurants/{slug}/ replaces the primary photo via multipart upload."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant = _create_restaurant(owner=owner)
    category = restaurant.categories.first()

    with override_settings(
        FILE_STORAGE_LOCAL_ROOT=str(tmp_path),
        FILE_STORAGE_LOCAL_URL="/media/",
    ):
        try:
            client.force_login(owner)
            create_response = client.generic(
                "PATCH",
                f"/api/v1/restaurants/{restaurant.slug}/",
                data=encode_multipart(
                    BOUNDARY,
                    {
                        "category_ids": [str(category.id)],
                        "primary_photo": _image_upload("restaurant-photo-1.png"),
                    },
                ),
                content_type=MULTIPART_CONTENT,
            )

            assert create_response.status_code == 200
            first_photo_url = create_response.json()["data"]["primary_photo_url"]
            assert first_photo_url.startswith("/api/v1/files/")

            update_response = client.generic(
                "PATCH",
                f"/api/v1/restaurants/{restaurant.slug}/",
                data=encode_multipart(
                    BOUNDARY,
                    {
                        "category_ids": [str(category.id)],
                        "primary_photo": _image_upload("restaurant-photo-2.png"),
                    },
                ),
                content_type=MULTIPART_CONTENT,
            )

            assert update_response.status_code == 200
            updated = update_response.json()["data"]
            assert updated["primary_photo_url"].startswith("/api/v1/files/")
            assert updated["primary_photo_url"] != first_photo_url
        finally:
            restaurant.delete()
            category.delete()
            owner.delete()

def test_restaurant_list_no_auth_required():
    """GET /restaurants/ should not require authentication."""
    client = Client()

    response = client.get("/api/v1/restaurants/")

    assert response.status_code == 200
    assert "data" in response.json()


def test_restaurant_list_marks_favorite_state_for_authenticated_user():
    """Authenticated reviewers should receive per-restaurant favorite flags in list responses."""
    client = Client()
    user = _create_user(role=UserRole.USER, prefix="list-favorite-user")
    favorited_restaurant = _create_restaurant(slug="list-favorited-restaurant")
    unfavorited_restaurant = _create_restaurant(slug="list-unfavorited-restaurant")
    favorite_category = favorited_restaurant.categories.first()
    unfavorite_category = unfavorited_restaurant.categories.first()

    try:
        Favorite.objects.create(user=user, restaurant=favorited_restaurant)
        client.force_login(user)

        response = client.get("/api/v1/restaurants/")

        assert response.status_code == 200
        payload = response.json()["data"]
        restaurants_by_slug = {item["slug"]: item for item in payload}
        assert restaurants_by_slug[favorited_restaurant.slug]["is_favorite"] is True
        assert restaurants_by_slug[unfavorited_restaurant.slug]["is_favorite"] is False
    finally:
        favorited_restaurant.delete()
        unfavorited_restaurant.delete()
        favorite_category.delete()
        unfavorite_category.delete()
        user.delete()


def test_restaurant_list_filters_by_search_query():
    client = Client()
    match_by_name = _create_restaurant(
        slug="search-ada-bistro",
        name_prefix="Ada Bistro",
        city="Istanbul",
        district="Kadikoy",
    )
    match_by_area = _create_restaurant(
        slug="search-besiktas-table",
        name_prefix="Harbor Table",
        city="Istanbul",
        district="Besiktas",
    )
    excluded = _create_restaurant(
        slug="search-hidden-spot",
        name_prefix="Hidden Spot",
        city="Ankara",
        district="Cankaya",
    )
    categories = [
        match_by_name.categories.first(),
        match_by_area.categories.first(),
        excluded.categories.first(),
    ]
    owners = [match_by_name.owner, match_by_area.owner, excluded.owner]

    try:
        response = client.get("/api/v1/restaurants/", {"q": "ada besiktas"})

        assert response.status_code == 200
        slugs = {item["slug"] for item in response.json()["data"]}
        assert slugs == {match_by_name.slug, match_by_area.slug}
    finally:
        match_by_name.delete()
        match_by_area.delete()
        excluded.delete()
        for category in categories:
            category.delete()
        for owner in owners:
            owner.delete()


def test_restaurant_homepage_returns_top_rated_and_newest_sections():
    client = Client()
    restaurants = [
        _create_restaurant(
            slug=f"homepage-restaurant-{index}",
            average_rating=rating,
            review_count=10 + index,
        )
        for index, rating in enumerate([4.1, 4.9, 3.8, 4.7, 4.3, 4.8])
    ]
    categories = [restaurant.categories.first() for restaurant in restaurants]
    owners = [restaurant.owner for restaurant in restaurants]
    now = timezone.now()

    try:
        for index, restaurant in enumerate(restaurants):
            Restaurant.objects.filter(pk=restaurant.pk).update(
                created_at=now - timezone.timedelta(days=index),
            )

        response = client.get("/api/v1/restaurants/homepage/")

        assert response.status_code == 200
        payload = response.json()["data"]
        assert set(payload.keys()) == {"top_rated", "newest"}
        assert [item["slug"] for item in payload["top_rated"]] == [
            "homepage-restaurant-1",
            "homepage-restaurant-5",
            "homepage-restaurant-3",
            "homepage-restaurant-4",
            "homepage-restaurant-0",
        ]
        assert [item["slug"] for item in payload["newest"]] == [
            "homepage-restaurant-0",
            "homepage-restaurant-1",
            "homepage-restaurant-2",
            "homepage-restaurant-3",
            "homepage-restaurant-4",
        ]
    finally:
        for restaurant in restaurants:
            restaurant.delete()
        for category in categories:
            category.delete()
        for owner in owners:
            owner.delete()


def test_restaurant_homepage_returns_empty_sections_when_no_restaurants():
    client = Client()

    response = client.get("/api/v1/restaurants/homepage/")

    assert response.status_code == 200
    assert response.json()["data"] == {"top_rated": [], "newest": []}


def test_category_list_no_auth_required():
    """GET /categories/ returns categories for restaurant creation forms."""
    client = Client()
    first = _create_category()
    second = _create_category()

    try:
        response = client.get("/api/v1/categories/")

        assert response.status_code == 200
        names = [item["name"] for item in response.json()["data"]]
        assert first.name in names
        assert second.name in names
    finally:
        first.delete()
        second.delete()


def test_favorite_restaurant_requires_authentication():
    """Favorite list is scoped to the current reviewer session."""
    client = Client()

    response = client.get("/api/v1/restaurants/favorites/")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "auth_required"


def test_favorite_restaurant_create_list_and_delete():
    """Reviewers can save, list, and remove favorite restaurants by slug."""
    client = Client()
    user = _create_user(role=UserRole.USER, prefix="favorite-user")
    restaurant = _create_restaurant(slug="favorite-test-restaurant")
    category = restaurant.categories.first()
    owner = restaurant.owner

    try:
        client.force_login(user)
        create_response = client.post(
            f"/api/v1/restaurants/{restaurant.slug}/favorite/",
        )

        assert create_response.status_code == 201
        created_payload = create_response.json()["data"]
        assert created_payload["is_favorite"] is True
        assert created_payload["restaurant"]["slug"] == restaurant.slug
        assert Favorite.objects.filter(user=user, restaurant=restaurant).exists()

        list_response = client.get("/api/v1/restaurants/favorites/")

        assert list_response.status_code == 200
        list_payload = list_response.json()
        assert [item["slug"] for item in list_payload["data"]] == [restaurant.slug]
        assert list_payload["pagination"]["total"] == 1

        delete_response = client.delete(
            f"/api/v1/restaurants/{restaurant.slug}/favorite/",
        )

        assert delete_response.status_code == 200
        assert delete_response.json()["data"]["is_favorite"] is False
        assert not Favorite.objects.filter(user=user, restaurant=restaurant).exists()
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()
        user.delete()


def test_restaurant_mine_requires_owner_role():
    """GET /restaurants/mine/ is only for restaurant owners."""
    client = Client()
    user = _create_user(role=UserRole.USER)

    try:
        client.force_login(user)
        response = client.get("/api/v1/restaurants/mine/")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
    finally:
        user.delete()


def test_restaurant_mine_returns_only_owned_restaurants():
    """Owners can fetch only their own restaurants for the dashboard."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    other_owner = _create_user(role=UserRole.OWNER)
    owned = _create_restaurant(owner=owner)
    other = _create_restaurant(owner=other_owner)

    try:
        client.force_login(owner)
        response = client.get("/api/v1/restaurants/mine/")

        assert response.status_code == 200
        payload = response.json()
        slugs = [item["slug"] for item in payload["data"]]
        assert owned.slug in slugs
        assert other.slug not in slugs
    finally:
        owned_category = owned.categories.first()
        other_category = other.categories.first()
        owned.delete()
        other.delete()
        owned_category.delete()
        other_category.delete()
        owner.delete()
        other_owner.delete()


def test_restaurant_dashboard_returns_owner_analytics():
    """GET /restaurants/mine/dashboard/ returns owner analytics payload."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    reviewer = _create_user(role=UserRole.USER, prefix="dashboard-reviewer")
    restaurant = _create_restaurant(owner=owner, average_rating="4.50", review_count=2)
    other_restaurant = _create_restaurant(average_rating="5.00", review_count=1)
    first_review = _create_review(restaurant=restaurant, user=reviewer, rating=4)
    second_review = _create_review(
        restaurant=restaurant,
        user=_create_user(role=UserRole.USER, prefix="dashboard-reviewer-2"),
        rating=5,
    )
    other_review = _create_review(restaurant=other_restaurant, rating=5)

    try:
        client.force_login(owner)
        response = client.get("/api/v1/restaurants/mine/dashboard/")

        assert response.status_code == 200
        payload = response.json()["data"]
        assert payload["summary"]["restaurant_count"] == 1
        assert payload["summary"]["review_count"] == 2
        assert payload["summary"]["reviewer_count"] == 2
        assert payload["summary"]["average_rating"] == 4.5

        assert [item["slug"] for item in payload["restaurants"]] == [restaurant.slug]
        restaurant_payload = payload["restaurants"][0]
        assert restaurant_payload["review_count"] == 2
        assert restaurant_payload["average_rating"] == 4.5
        assert len(restaurant_payload["reviewer_stats"]) == 2
        assert restaurant_payload["rating_progress"]

        reviewer_ids = {item["id"] for item in payload["reviewers"]}
        assert str(reviewer.id) in reviewer_ids
    finally:
        first_review.delete()
        second_review.user.delete()
        second_review.delete()
        other_review.delete()
        other_restaurant_category = other_restaurant.categories.first()
        restaurant_category = restaurant.categories.first()
        restaurant.delete()
        other_restaurant.delete()
        restaurant_category.delete()
        other_restaurant_category.delete()
        reviewer.delete()
        owner.delete()


def test_restaurant_detail_no_auth_required():
    """GET /restaurants/{slug}/ should not require authentication."""
    client = Client()
    restaurant = _create_restaurant()
    category = restaurant.categories.first()
    owner = restaurant.owner

    try:
        response = client.get(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 200
        assert "data" in response.json()
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()


def test_restaurant_delete_requires_authentication():
    """DELETE /restaurants/{slug}/ requires authentication."""
    client = Client()
    restaurant = _create_restaurant()
    category = restaurant.categories.first()
    owner = restaurant.owner

    try:
        response = client.delete(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "auth_required"
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()


def test_restaurant_delete_requires_admin_role():
    """DELETE /restaurants/{slug}/ requires admin role."""
    client = Client()
    regular_user = _create_user(role=UserRole.USER)
    restaurant = _create_restaurant()
    category = restaurant.categories.first()
    owner = restaurant.owner

    try:
        client.force_login(regular_user)
        response = client.delete(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()
        regular_user.delete()


def test_restaurant_delete_success_by_admin():
    """DELETE /restaurants/{slug}/ succeeds for admin user."""
    client = Client()
    admin = _create_user(role=UserRole.ADMIN)
    restaurant = _create_restaurant()

    try:
        client.force_login(admin)
        response = client.delete(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 204
        assert not Restaurant.objects.filter(slug=restaurant.slug).exists()
    finally:
        admin.delete()


def test_restaurant_delete_session_auth_requires_csrf_when_enforced():
    """Session-authenticated unsafe requests still enforce CSRF protection."""
    client = Client(enforce_csrf_checks=True)
    admin = _create_user(role=UserRole.ADMIN)
    restaurant = _create_restaurant()
    category = restaurant.categories.first()

    try:
        client.force_login(admin)
        response = client.delete(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
        assert "CSRF" in response.json()["error"]["message"]
        assert Restaurant.objects.filter(slug=restaurant.slug).exists()
    finally:
        restaurant.delete()
        category.delete()
        admin.delete()


def test_restaurant_delete_not_found():
    """DELETE /restaurants/{slug}/ returns 404 for non-existent slug."""
    client = Client()
    admin = _create_user(role=UserRole.ADMIN)
    client.force_login(admin)

    response = client.delete("/api/v1/restaurants/nonexistent-slug/")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"

    admin.delete()


def test_restaurant_delete_owner_cannot_delete():
    """DELETE /restaurants/{slug}/ fails for owner role."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant = _create_restaurant()
    category = restaurant.categories.first()

    try:
        client.force_login(owner)
        response = client.delete(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()


def test_menu_item_list_no_auth_required():
    """GET /restaurants/{slug}/menu-items/ exposes menu items for a restaurant."""
    client = Client()
    restaurant = _create_restaurant()
    category = restaurant.categories.first()
    owner = restaurant.owner
    menu_item = MenuItem.objects.create(
        restaurant=restaurant,
        name="Test Burger",
        description="A test menu item",
        category=category,
        price="12.50",
        currency="EUR",
        is_available=True,
    )

    try:
        response = client.get(f"/api/v1/restaurants/{restaurant.slug}/menu-items/")

        assert response.status_code == 200
        payload = response.json()
        assert payload["data"][0]["id"] == str(menu_item.id)
        assert payload["data"][0]["name"] == "Test Burger"
        assert payload["data"][0]["category"]["id"] == str(category.id)
        assert payload["data"][0]["price"] == "12.50"
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()


def test_menu_item_create_requires_authentication():
    """POST /restaurants/{slug}/menu-items/ requires a logged-in user."""
    client = Client()
    restaurant = _create_restaurant()
    category = restaurant.categories.first()
    owner = restaurant.owner

    try:
        response = client.post(
            f"/api/v1/restaurants/{restaurant.slug}/menu-items/",
            data={
                "name": "Soup",
                "category_id": str(category.id),
                "price": "7.00",
                "currency": "EUR",
                "is_available": True,
            },
            content_type="application/json",
        )

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "auth_required"
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()


def test_menu_item_create_update_delete_by_restaurant_owner():
    """Restaurant owners can create, update, and delete their own menu items."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant = _create_restaurant(owner=owner)
    category = restaurant.categories.first()

    try:
        client.force_login(owner)
        create_response = client.post(
            f"/api/v1/restaurants/{restaurant.slug}/menu-items/",
            data={
                "name": "Lentil Soup",
                "description": "Warm starter",
                "category_id": str(category.id),
                "price": "6.50",
                "currency": "EUR",
                "is_available": True,
            },
            content_type="application/json",
        )

        assert create_response.status_code == 201
        created = create_response.json()["data"]
        assert created["name"] == "Lentil Soup"
        assert created["category"]["id"] == str(category.id)

        menu_item_id = created["id"]
        patch_response = client.patch(
            f"/api/v1/restaurants/{restaurant.slug}/menu-items/{menu_item_id}/",
            data={"price": "7.25", "is_available": False},
            content_type="application/json",
        )

        assert patch_response.status_code == 200
        patched = patch_response.json()["data"]
        assert patched["price"] == "7.25"
        assert patched["is_available"] is False

        delete_response = client.delete(
            f"/api/v1/restaurants/{restaurant.slug}/menu-items/{menu_item_id}/"
        )

        assert delete_response.status_code == 204
        assert not MenuItem.objects.filter(id=menu_item_id).exists()
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()


def test_menu_item_create_for_other_owner_forbidden():
    """Owners cannot manage another owner's restaurant menu."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    other_owner = _create_user(role=UserRole.OWNER)
    restaurant = _create_restaurant(owner=owner)
    category = restaurant.categories.first()

    try:
        client.force_login(other_owner)
        response = client.post(
            f"/api/v1/restaurants/{restaurant.slug}/menu-items/",
            data={
                "name": "Soup",
                "category_id": str(category.id),
                "price": "7.00",
                "currency": "EUR",
                "is_available": True,
            },
            content_type="application/json",
        )

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()
        other_owner.delete()


def test_menu_item_detail_is_scoped_to_restaurant():
    """Menu item detail routes should not leak items from a different restaurant."""
    client = Client()
    first_restaurant = _create_restaurant()
    second_restaurant = _create_restaurant()
    menu_item = MenuItem.objects.create(
        restaurant=first_restaurant,
        name="Only First Restaurant",
        category=first_restaurant.categories.first(),
        price="10.00",
        currency="EUR",
        is_available=True,
    )

    try:
        response = client.get(
            f"/api/v1/restaurants/{second_restaurant.slug}/menu-items/{menu_item.id}/"
        )

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"
    finally:
        first_owner = first_restaurant.owner
        second_owner = second_restaurant.owner
        first_category = first_restaurant.categories.first()
        second_category = second_restaurant.categories.first()
        first_restaurant.delete()
        second_restaurant.delete()
        first_category.delete()
        second_category.delete()
        first_owner.delete()
        second_owner.delete()


def test_restaurant_detail_includes_opening_hours_and_favorite_state():
    client = Client()
    reviewer = _create_user(role=UserRole.USER, prefix="detail-reviewer")
    restaurant = _create_restaurant(slug="detail-hours-favorite")
    category = restaurant.categories.first()
    owner = restaurant.owner

    try:
        from restaurants.models import OpeningHour

        OpeningHour.objects.create(
            restaurant=restaurant,
            day_of_week=0,
            open_time="09:00",
            close_time="22:30",
            is_closed=False,
        )
        client.force_login(reviewer)
        favorite_response = client.post(f"/api/v1/restaurants/{restaurant.slug}/favorite/")
        assert favorite_response.status_code == 201

        response = client.get(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 200
        payload = response.json()["data"]
        assert payload["is_favorite"] is True
        assert payload["favorite_count"] == 1
        assert payload["favorite_score"] > 0
        assert payload["opening_hours"][0]["day_of_week"] == 0
        assert payload["opening_hours"][0]["day_display"] == "Monday"
        assert payload["opening_hours"][0]["open_time"] == "09:00:00"
        assert payload["opening_hours"][0]["close_time"] == "22:30:00"
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()
        reviewer.delete()


def test_favorite_mutations_update_restaurant_metrics():
    client = Client()
    reviewer = _create_user(role=UserRole.USER, prefix="metrics-reviewer")
    restaurant = _create_restaurant(slug="metrics-favorite-restaurant")
    category = restaurant.categories.first()
    owner = restaurant.owner

    try:
        client.force_login(reviewer)
        create_response = client.post(f"/api/v1/restaurants/{restaurant.slug}/favorite/")
        restaurant.refresh_from_db()

        assert create_response.status_code == 201
        assert create_response.json()["data"]["favorite_count"] == 1
        assert restaurant.favorite_count == 1
        assert restaurant.favorite_score == 1
        assert restaurant.last_favorited_at is not None

        delete_response = client.delete(f"/api/v1/restaurants/{restaurant.slug}/favorite/")
        restaurant.refresh_from_db()

        assert delete_response.status_code == 200
        assert delete_response.json()["data"]["favorite_count"] == 0
        assert restaurant.favorite_count == 0
        assert restaurant.favorite_score == 0
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()
        reviewer.delete()


def test_owner_dashboard_includes_favorite_metrics():
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    reviewer = _create_user(role=UserRole.USER, prefix="favorite-dashboard")
    restaurant = _create_restaurant(owner=owner, slug="favorite-dashboard-restaurant")
    category = restaurant.categories.first()
    Favorite.objects.create(user=reviewer, restaurant=restaurant)

    try:
        restaurant.favorite_count = 1
        restaurant.favorite_score = 1
        restaurant.save(update_fields=["favorite_count", "favorite_score"])

        client.force_login(owner)
        response = client.get("/api/v1/restaurants/mine/dashboard/")

        assert response.status_code == 200
        payload = response.json()["data"]
        assert payload["summary"]["favorite_count"] == 1
        assert payload["restaurants"][0]["favorite_count"] == 1
        assert payload["restaurants"][0]["favorite_score"] == 1
    finally:
        restaurant.delete()
        category.delete()
        owner.delete()
        reviewer.delete()
