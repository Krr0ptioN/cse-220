"""Tests for review reply endpoints."""

import uuid

import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from restaurants.models import Category, Restaurant
from reviews.models import Review
from users.models import UserRole

pytestmark = pytest.mark.django_db


def _create_user(*, role=UserRole.USER):
    suffix = uuid.uuid4().hex[:8]
    return get_user_model().objects.create_user(
        email=f"reply-{role}-{suffix}@example.com",
        username=f"reply-{role}-{suffix}",
        password="test-pass-123",
        display_name=f"{role} {suffix}",
        role=role,
    )


def _create_restaurant(owner):
    suffix = uuid.uuid4().hex[:8]
    category = Category.objects.create(name=f"Cat {suffix}")
    restaurant = Restaurant.objects.create(
        name=f"Restaurant {suffix}",
        description="desc",
        owner=owner,
        address_line1="Street 1",
        city="Istanbul",
        price_range="2",
    )
    restaurant.categories.set([category])
    return restaurant, category


def _create_review(*, restaurant, user, rating=4, content="Great place to eat here"):
    return Review.objects.create(
        restaurant=restaurant,
        user=user,
        rating=rating,
        content=content,
    )

def test_reply_requires_authentication():
    """POST /reviews/<id>/replies/ must reject anonymous users."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant, category = _create_restaurant(owner)
    reviewer = _create_user()
    review = _create_review(restaurant=restaurant, user=reviewer)

    try:
        response = client.post(
            f"/api/v1/reviews/{review.id}/replies/",
            data={"rating": 5, "content": "Thank you for your kind words!"},
            content_type="application/json",
        )
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "auth_required"
    finally:
        review.delete()
        restaurant.delete()
        category.delete()
        reviewer.delete()
        owner.delete()


def test_reply_created_successfully():
    """Authenticated user can reply to a top-level review."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant, category = _create_restaurant(owner)
    reviewer = _create_user()
    review = _create_review(restaurant=restaurant, user=reviewer)
    replier = _create_user()

    try:
        client.force_login(replier)
        response = client.post(
            f"/api/v1/reviews/{review.id}/replies/",
            data={"rating": 5, "content": "Thank you for your kind words!"},
            content_type="application/json",
        )
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["parent_id"] == str(review.id)
        assert data["content"] == "Thank you for your kind words!"
    finally:
        Review.objects.filter(restaurant=restaurant).delete()
        restaurant.delete()
        category.delete()
        reviewer.delete()
        replier.delete()
        owner.delete()


def test_reply_to_reply_is_rejected():
    """Replying to a reply must return 400 — only one level allowed."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant, category = _create_restaurant(owner)
    reviewer = _create_user()
    review = _create_review(restaurant=restaurant, user=reviewer)
    replier = _create_user()
    # Create a first reply directly in DB
    first_reply = Review.objects.create(
        restaurant=restaurant,
        user=replier,
        rating=5,
        content="This is already a reply.",
        parent=review,
    )
    deep_replier = _create_user()

    try:
        client.force_login(deep_replier)
        response = client.post(
            f"/api/v1/reviews/{first_reply.id}/replies/",
            data={"rating": 3, "content": "Trying to reply to a reply here."},
            content_type="application/json",
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "validation_error"
    finally:
        Review.objects.filter(restaurant=restaurant).delete()
        restaurant.delete()
        category.delete()
        reviewer.delete()
        replier.delete()
        deep_replier.delete()
        owner.delete()


def test_replies_appear_nested_in_review_list():
    """Replies show up inline under their parent when listing restaurant reviews."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant, category = _create_restaurant(owner)
    reviewer = _create_user()
    review = _create_review(restaurant=restaurant, user=reviewer)
    replier = _create_user()
    Review.objects.create(
        restaurant=restaurant,
        user=replier,
        rating=5,
        content="Thanks for the great review!",
        parent=review,
    )

    try:
        response = client.get(f"/api/v1/reviews/restaurants/{restaurant.slug}/")
        assert response.status_code == 200
        reviews = response.json()["data"]
        parent = next(r for r in reviews if r["id"] == str(review.id))
        assert len(parent["replies"]) == 1
        assert parent["replies"][0]["parent_id"] == str(review.id)
    finally:
        Review.objects.filter(restaurant=restaurant).delete()
        restaurant.delete()
        category.delete()
        reviewer.delete()
        replier.delete()
        owner.delete()


def test_reply_to_nonexistent_review_returns_404():
    """POST /reviews/<random-id>/replies/ returns 404 for unknown review."""
    client = Client()
    user = _create_user()

    try:
        client.force_login(user)
        response = client.post(
            f"/api/v1/reviews/{uuid.uuid4()}/replies/",
            data={"rating": 4, "content": "This review does not exist."},
            content_type="application/json",
        )
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"
    finally:
        user.delete()

def test_like_requires_authentication():
    """POST /reviews/<id>/like/ must reject anonymous users."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant, category = _create_restaurant(owner)
    reviewer = _create_user()
    review = _create_review(restaurant=restaurant, user=reviewer)

    try:
        response = client.post(f"/api/v1/reviews/{review.id}/like/")
        assert response.status_code == 401
    finally:
        review.delete()
        restaurant.delete()
        category.delete()
        reviewer.delete()
        owner.delete()


def test_like_creates_reaction():
    """POST /reviews/<id>/like/ increments like_count by 1."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant, category = _create_restaurant(owner)
    reviewer = _create_user()
    review = _create_review(restaurant=restaurant, user=reviewer)
    voter = _create_user()

    try:
        client.force_login(voter)
        response = client.post(f"/api/v1/reviews/{review.id}/like/")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["like_count"] == 1
        assert data["dislike_count"] == 0
        assert data["user_reaction"] == "like"
    finally:
        Review.objects.filter(restaurant=restaurant).delete()
        restaurant.delete()
        category.delete()
        reviewer.delete()
        voter.delete()
        owner.delete()


def test_like_toggles_off_when_clicked_twice():
    """POST /reviews/<id>/like/ twice removes the reaction (toggle off)."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant, category = _create_restaurant(owner)
    reviewer = _create_user()
    review = _create_review(restaurant=restaurant, user=reviewer)
    voter = _create_user()

    try:
        client.force_login(voter)
        client.post(f"/api/v1/reviews/{review.id}/like/")
        response = client.post(f"/api/v1/reviews/{review.id}/like/")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["like_count"] == 0
        assert data["user_reaction"] is None
    finally:
        Review.objects.filter(restaurant=restaurant).delete()
        restaurant.delete()
        category.delete()
        reviewer.delete()
        voter.delete()
        owner.delete()


def test_like_switches_to_dislike():
    """POST /reviews/<id>/dislike/ after a like switches the reaction."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant, category = _create_restaurant(owner)
    reviewer = _create_user()
    review = _create_review(restaurant=restaurant, user=reviewer)
    voter = _create_user()

    try:
        client.force_login(voter)
        client.post(f"/api/v1/reviews/{review.id}/like/")
        response = client.post(f"/api/v1/reviews/{review.id}/dislike/")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["like_count"] == 0
        assert data["dislike_count"] == 1
        assert data["user_reaction"] == "dislike"
    finally:
        Review.objects.filter(restaurant=restaurant).delete()
        restaurant.delete()
        category.delete()
        reviewer.delete()
        voter.delete()
        owner.delete()


def test_sort_by_helpful_returns_most_liked_first():
    """GET ?sort=helpful returns reviews ordered by helpfulness score."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant, category = _create_restaurant(owner)
    reviewer1 = _create_user()
    reviewer2 = _create_user()
    voter = _create_user()

    # review1 gets 1 like, review2 gets none
    review1 = _create_review(restaurant=restaurant, user=reviewer1, content="First review here")
    review2 = _create_review(restaurant=restaurant, user=reviewer2, content="Second review here")

    try:
        client.force_login(voter)
        client.post(f"/api/v1/reviews/{review1.id}/like/")

        response = client.get(f"/api/v1/reviews/restaurants/{restaurant.slug}/?sort=helpful")
        assert response.status_code == 200
        reviews = response.json()["data"]
        ids = [r["id"] for r in reviews]
        assert ids.index(str(review1.id)) < ids.index(str(review2.id))
    finally:
        Review.objects.filter(restaurant=restaurant).delete()
        restaurant.delete()
        category.delete()
        reviewer1.delete()
        reviewer2.delete()
        voter.delete()
        owner.delete()


def test_user_reaction_shown_in_review_list():
    """Review list includes user_reaction field reflecting the current user's vote."""
    client = Client()
    owner = _create_user(role=UserRole.OWNER)
    restaurant, category = _create_restaurant(owner)
    reviewer = _create_user()
    review = _create_review(restaurant=restaurant, user=reviewer)
    voter = _create_user()

    try:
        client.force_login(voter)
        client.post(f"/api/v1/reviews/{review.id}/like/")

        response = client.get(f"/api/v1/reviews/restaurants/{restaurant.slug}/")
        assert response.status_code == 200
        reviews = response.json()["data"]
        target = next(r for r in reviews if r["id"] == str(review.id))
        assert target["user_reaction"] == "like"
    finally:
        Review.objects.filter(restaurant=restaurant).delete()
        restaurant.delete()
        category.delete()
        reviewer.delete()
        voter.delete()
        owner.delete()