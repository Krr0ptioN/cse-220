"""Tests for restaurant endpoints with guards and authentication."""

import uuid

import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from restaurants.models import Category, Restaurant
from users.models import UserRole

pytestmark = pytest.mark.django_db


def _create_user(*, role: str = UserRole.USER):
    suffix = uuid.uuid4().hex[:8]
    user_model = get_user_model()
    return user_model.objects.create_user(
        email=f"restaurant-{role}-{suffix}@example.com",
        username=f"restaurant-{role}-{suffix}",
        password="test-password-123",
        display_name=f"{role.title()} {suffix}",
        role=role,
    )


def _create_category():
    suffix = uuid.uuid4().hex[:8]
    return Category.objects.create(
        name=f"Test Category {suffix}",
        description="Category for tests",
    )


def _create_restaurant(owner=None, slug=None):
    if owner is None:
        owner = _create_user(role=UserRole.OWNER)
    category = _create_category()
    suffix = uuid.uuid4().hex[:8]
    return Restaurant.objects.create(
        name=f"Test Restaurant {suffix}",
        slug=slug or f"test-restaurant-{suffix}",
        description="A test restaurant",
        category=category,
        owner=owner,
        address_line1="Test Street 123",
        city="Istanbul",
        district="Besiktas",
        price_range="2",
    )


def test_restaurant_list_no_auth_required():
    """GET /restaurants/ should not require authentication."""
    client = Client()

    response = client.get("/api/v1/restaurants/")

    assert response.status_code == 200
    assert "data" in response.json()


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
        owned_category = owned.category
        other_category = other.category
        owned.delete()
        other.delete()
        owned_category.delete()
        other_category.delete()
        owner.delete()
        other_owner.delete()


def test_restaurant_detail_no_auth_required():
    """GET /restaurants/{slug}/ should not require authentication."""
    client = Client()
    restaurant = _create_restaurant()

    try:
        response = client.get(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 200
        assert "data" in response.json()
    finally:
        restaurant.delete()
        restaurant.category.delete()
        restaurant.owner.delete()


def test_restaurant_delete_requires_authentication():
    """DELETE /restaurants/{slug}/ requires authentication."""
    client = Client()
    restaurant = _create_restaurant()

    try:
        response = client.delete(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "auth_required"
    finally:
        restaurant.delete()
        restaurant.category.delete()
        restaurant.owner.delete()


def test_restaurant_delete_requires_admin_role():
    """DELETE /restaurants/{slug}/ requires admin role."""
    client = Client()
    regular_user = _create_user(role=UserRole.USER)
    restaurant = _create_restaurant()

    try:
        client.force_login(regular_user)
        response = client.delete(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
    finally:
        restaurant.delete()
        restaurant.category.delete()
        restaurant.owner.delete()
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

    try:
        client.force_login(admin)
        response = client.delete(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
        assert "CSRF" in response.json()["error"]["message"]
        assert Restaurant.objects.filter(slug=restaurant.slug).exists()
    finally:
        restaurant.delete()
        restaurant.category.delete()
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

    try:
        client.force_login(owner)
        response = client.delete(f"/api/v1/restaurants/{restaurant.slug}/")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
    finally:
        restaurant.delete()
        restaurant.category.delete()
        owner.delete()
