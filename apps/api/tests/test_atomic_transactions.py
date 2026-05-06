"""Atomic transaction rollback tests."""

import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model

from restaurants.models import Category, OpeningHour, Restaurant
from reviews.models import Review, ReviewLike
from reviews.services import ReviewService
from restaurants.services import RestaurantService
from api.exceptions import ApiError

pytestmark = pytest.mark.django_db

User = get_user_model()


@pytest.fixture
def user(db):
    import uuid
    suffix = uuid.uuid4().hex[:8]
    return User.objects.create_user(
        email=f"test-{suffix}@example.com",
        username=f"test-{suffix}",
        password="testpass123",
    )


@pytest.fixture
def category(db):
    import uuid
    suffix = uuid.uuid4().hex[:8]
    return Category.objects.create(name=f"Category {suffix}")


@pytest.fixture
def restaurant(db, user, category):
    import uuid
    suffix = uuid.uuid4().hex[:8]
    r = Restaurant.objects.create(
        name=f"Restaurant {suffix}",
        description="Test",
        owner=user,
        address_line1="Test St",
        city="Istanbul",
    )
    r.categories.set([category])
    return r


@pytest.fixture
def review(db, user, restaurant):
    return Review.objects.create(
        restaurant=restaurant,
        user=user,
        rating=4,
        content="This is a test review content.",
    )


def test_create_review_rolls_back_on_duplicate(user, restaurant):
    """Second review from same user on same restaurant must not persist."""
    service = ReviewService()

    service.create_review(
        restaurant=restaurant,
        user=user,
        data={"rating": 4, "content": "First review content here."},
    )

    review_count_before = Review.objects.filter(restaurant=restaurant).count()

    with pytest.raises(ApiError) as exc_info:
        service.create_review(
            restaurant=restaurant,
            user=user,
            data={"rating": 5, "content": "Trying to submit again here."},
        )

    assert exc_info.value.status_code == 409
    assert Review.objects.filter(restaurant=restaurant).count() == review_count_before


def test_delete_review_rolls_back_if_delete_fails(user, review):
    """If an error occurs mid-transaction during delete, the review must still exist."""
    service = ReviewService()
    review_id = review.id

    original_delete = service.repository.delete_review

    def delete_then_fail(r):
        original_delete(r)
        raise Exception("Simulated failure")

    with patch.object(service.repository, "delete_review", side_effect=delete_then_fail):
        with pytest.raises(Exception, match="Simulated failure"):
            service.delete_review(user=user, review=review)

    assert Review.objects.filter(id=review_id).exists()


def test_set_reaction_rolls_back_if_count_update_fails(user, review):
    """If count update fails after reaction is set, reaction must not persist."""
    service = ReviewService()

    with patch.object(
        service.repository,
        "update_reaction_counts",
        side_effect=Exception("Simulated failure"),
    ):
        with pytest.raises(Exception, match="Simulated failure"):
            service.set_reaction(user=user, review=review, is_like=True)

    assert not ReviewLike.objects.filter(review=review, user=user).exists()


def test_update_review_rolls_back_if_aggregate_update_fails(user, review, restaurant):
    """If aggregate update fails after review save, the review must keep its original content."""
    service = ReviewService()
    original_content = review.content

    with patch.object(
        service.repository,
        "update_restaurant_aggregates",
        side_effect=Exception("Simulated failure"),
    ):
        with pytest.raises(Exception, match="Simulated failure"):
            service.update_review(
                user=user,
                review=review,
                data={"rating": 1, "content": "Completely changed content here."},
            )

    review.refresh_from_db()
    assert review.content == original_content
    assert review.rating == 4


def test_set_opening_hours_rolls_back_if_bulk_create_fails(restaurant):
    """If bulk_create fails after delete, original opening hours must still exist."""
    from restaurants.repositories import RestaurantRepository

    repository = RestaurantRepository()

    original_hours = [
        {"day_of_week": 0, "open_time": "09:00", "close_time": "22:00", "is_closed": False},
        {"day_of_week": 1, "open_time": "09:00", "close_time": "22:00", "is_closed": False},
    ]
    repository.set_opening_hours(restaurant, original_hours)
    hours_count_before = OpeningHour.objects.filter(restaurant=restaurant).count()

    with patch(
        "restaurants.models.OpeningHour.objects.bulk_create",
        side_effect=Exception("Simulated failure"),
    ):
        with pytest.raises(Exception, match="Simulated failure"):
            repository.set_opening_hours(restaurant, [
                {"day_of_week": 2, "open_time": "10:00", "close_time": "20:00", "is_closed": False},
            ])

    assert OpeningHour.objects.filter(restaurant=restaurant).count() == hours_count_before