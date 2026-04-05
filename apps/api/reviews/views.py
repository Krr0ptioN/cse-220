"""Views for review endpoints."""

import json

from django.db import IntegrityError, transaction

from api_http import Controller, controller, delete, get, patch, post
from restaurants.models import Restaurant
from reviews.dtos import ReviewDto
from reviews.models import Review, ReviewLike
from users.models import UserRole


@controller()
class ReviewsController(Controller):
    """Controller for review endpoints."""

    @get("<uuid:review_id>/")
    def review_detail(self, review_id):
        """Return a single review by ID."""
        review = (
            Review.objects.filter(id=review_id)
            .select_related("user", "restaurant")
            .first()
        )
        if review is None:
            return self.error(
                status=404,
                code="not_found",
                message="Review not found.",
            )

        return self.json({"data": ReviewDto.from_model(review)})

    @get("restaurants/<slug:restaurant_slug>/")
    def restaurant_reviews(self, restaurant_slug):
        """Return paginated reviews for a restaurant."""
        restaurant = Restaurant.objects.filter(slug=restaurant_slug).first()
        if restaurant is None:
            return self.error(
                status=404,
                code="not_found",
                message="Restaurant not found.",
            )

        page_obj, pagination = self.paginate_queryset(
            Review.objects.filter(restaurant=restaurant, parent__isnull=True)
            .select_related("user")
            .order_by("-created_at")
        )

        data = ReviewDto.from_models(page_obj.object_list)

        return self.json(
            {
                "data": data,
                "pagination": pagination,
            }
        )

    @post("restaurants/<slug:restaurant_slug>/")
    def review_create(self, restaurant_slug):
        """Create a review for a restaurant. Requires authentication."""
        user, auth_error = self._require_authenticated_user()
        if auth_error is not None:
            return auth_error

        restaurant = Restaurant.objects.filter(slug=restaurant_slug).first()
        if restaurant is None:
            return self.error(
                status=404,
                code="not_found",
                message="Restaurant not found.",
            )

        payload, payload_error = self._parse_json_body()
        if payload_error is not None:
            return payload_error

        payload = payload or {}

        rating = payload.get("rating")
        content = payload.get("content", "").strip()

        if rating is None:
            return self.error(
                status=400,
                code="validation_error",
                message="Field 'rating' is required.",
            )

        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return self.error(
                status=400,
                code="validation_error",
                message="Field 'rating' must be an integer.",
            )

        if rating < 1 or rating > 5:
            return self.error(
                status=400,
                code="validation_error",
                message="Field 'rating' must be between 1 and 5.",
            )

        if not content:
            return self.error(
                status=400,
                code="validation_error",
                message="Field 'content' is required and cannot be empty.",
            )

        if len(content) < 10:
            return self.error(
                status=400,
                code="validation_error",
                message="Field 'content' must be at least 10 characters.",
            )

        if len(content) > 5000:
            return self.error(
                status=400,
                code="validation_error",
                message="Field 'content' must not exceed 5000 characters.",
            )

        parent_id = payload.get("parent_id")
        parent = None
        if parent_id:
            parent = Review.objects.filter(id=parent_id).first()
            if parent is None:
                return self.error(
                    status=404,
                    code="not_found",
                    message="Parent review not found.",
                )
            if parent.restaurant_id != restaurant.id:
                return self.error(
                    status=400,
                    code="validation_error",
                    message="Parent review belongs to a different restaurant.",
                )

        try:
            with transaction.atomic():
                review = Review.objects.create(
                    restaurant=restaurant,
                    user=user,
                    rating=rating,
                    content=content,
                    parent=parent,
                )
                if parent is None:
                    self._update_restaurant_aggregates(restaurant)
        except IntegrityError:
            return self.error(
                status=409,
                code="conflict",
                message="You have already reviewed this restaurant.",
            )

        return self.created({"data": ReviewDto.from_model(review)})

    @patch("<uuid:review_id>/")
    def review_update(self, review_id):
        """Update a review. Only the review author can edit."""
        user, auth_error = self._require_authenticated_user()
        if auth_error is not None:
            return auth_error

        review = Review.objects.filter(id=review_id).first()
        if review is None:
            return self.error(
                status=404,
                code="not_found",
                message="Review not found.",
            )

        if review.user_id != user.id and user.role != UserRole.ADMIN:
            return self.error(
                status=403,
                code="forbidden",
                message="You can only edit your own reviews.",
            )

        payload, payload_error = self._parse_json_body()
        if payload_error is not None:
            return payload_error

        payload = payload or {}
        if not payload:
            return self.error(
                status=400,
                code="validation_error",
                message="At least one field is required to update a review.",
            )

        if "rating" in payload:
            try:
                rating = int(payload["rating"])
            except (TypeError, ValueError):
                return self.error(
                    status=400,
                    code="validation_error",
                    message="Field 'rating' must be an integer.",
                )
            if rating < 1 or rating > 5:
                return self.error(
                    status=400,
                    code="validation_error",
                    message="Field 'rating' must be between 1 and 5.",
                )
            review.rating = rating

        if "content" in payload:
            content = payload["content"].strip()
            if not content:
                return self.error(
                    status=400,
                    code="validation_error",
                    message="Field 'content' cannot be empty.",
                )
            if len(content) < 10:
                return self.error(
                    status=400,
                    code="validation_error",
                    message="Field 'content' must be at least 10 characters.",
                )
            if len(content) > 5000:
                return self.error(
                    status=400,
                    code="validation_error",
                    message="Field 'content' must not exceed 5000 characters.",
                )
            review.content = content

        review.save()

        if review.parent is None:
            self._update_restaurant_aggregates(review.restaurant)

        return self.json({"data": ReviewDto.from_model(review)})

    @delete("<uuid:review_id>/")
    def review_delete(self, review_id):
        """Delete a review. Only the review author or admin can delete."""
        user, auth_error = self._require_authenticated_user()
        if auth_error is not None:
            return auth_error

        review = Review.objects.filter(id=review_id).first()
        if review is None:
            return self.error(
                status=404,
                code="not_found",
                message="Review not found.",
            )

        if review.user_id != user.id and user.role != UserRole.ADMIN:
            return self.error(
                status=403,
                code="forbidden",
                message="You can only delete your own reviews.",
            )

        restaurant = review.restaurant
        with transaction.atomic():
            review.delete()
            self._update_restaurant_aggregates(restaurant)

        return self.no_content()

    @post("<uuid:review_id>/like/")
    def review_like(self, review_id):
        """Like or unlike a review. Requires authentication."""
        user, auth_error = self._require_authenticated_user()
        if auth_error is not None:
            return auth_error

        review = Review.objects.filter(id=review_id).first()
        if review is None:
            return self.error(
                status=404,
                code="not_found",
                message="Review not found.",
            )

        reaction, created = ReviewLike.objects.update_or_create(
            review=review,
            user=user,
            defaults={"is_like": True},
        )

        self._update_reaction_counts(review)

        return self.json(
            {
                "data": {
                    "like_count": review.like_count,
                    "dislike_count": review.dislike_count,
                    "user_reaction": "like",
                }
            }
        )

    @delete("<uuid:review_id>/like/")
    def review_unlike(self, review_id):
        """Remove a like from a review. Requires authentication."""
        user, auth_error = self._require_authenticated_user()
        if auth_error is not None:
            return auth_error

        review = Review.objects.filter(id=review_id).first()
        if review is None:
            return self.error(
                status=404,
                code="not_found",
                message="Review not found.",
            )

        ReviewLike.objects.filter(review=review, user=user, is_like=True).delete()
        self._update_reaction_counts(review)

        return self.json(
            {
                "data": {
                    "like_count": review.like_count,
                    "dislike_count": review.dislike_count,
                    "user_reaction": None,
                }
            }
        )

    @post("<uuid:review_id>/dislike/")
    def review_dislike(self, review_id):
        """Dislike a review. Requires authentication."""
        user, auth_error = self._require_authenticated_user()
        if auth_error is not None:
            return auth_error

        review = Review.objects.filter(id=review_id).first()
        if review is None:
            return self.error(
                status=404,
                code="not_found",
                message="Review not found.",
            )

        ReviewLike.objects.update_or_create(
            review=review,
            user=user,
            defaults={"is_like": False},
        )

        self._update_reaction_counts(review)

        return self.json(
            {
                "data": {
                    "like_count": review.like_count,
                    "dislike_count": review.dislike_count,
                    "user_reaction": "dislike",
                }
            }
        )

    @delete("<uuid:review_id>/dislike/")
    def review_undislike(self, review_id):
        """Remove a dislike from a review. Requires authentication."""
        user, auth_error = self._require_authenticated_user()
        if auth_error is not None:
            return auth_error

        review = Review.objects.filter(id=review_id).first()
        if review is None:
            return self.error(
                status=404,
                code="not_found",
                message="Review not found.",
            )

        ReviewLike.objects.filter(review=review, user=user, is_like=False).delete()
        self._update_reaction_counts(review)

        return self.json(
            {
                "data": {
                    "like_count": review.like_count,
                    "dislike_count": review.dislike_count,
                    "user_reaction": None,
                }
            }
        )

    def _require_authenticated_user(self):
        user = getattr(self.request, "user", None)
        if user is None or not user.is_authenticated:
            return (
                None,
                self.error(
                    status=401,
                    code="auth_required",
                    message="Authentication is required.",
                ),
            )
        return user, None

    def _parse_json_body(self):
        raw_body = self.request.body.decode("utf-8") if self.request.body else ""
        if not raw_body.strip():
            return {}, None

        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            return (
                None,
                self.error(
                    status=400,
                    code="validation_error",
                    message="Request body must be valid JSON.",
                ),
            )

        if not isinstance(payload, dict):
            return (
                None,
                self.error(
                    status=400,
                    code="validation_error",
                    message="Request body must be a JSON object.",
                ),
            )

        return payload, None

    def _update_restaurant_aggregates(self, restaurant):
        from django.db.models import Avg, Count

        aggregate = Review.objects.filter(
            restaurant=restaurant,
            parent__isnull=True,
        ).aggregate(
            review_count=Count("id"),
            avg_rating=Avg("rating"),
        )

        average = aggregate["avg_rating"]
        if average is None:
            avg_rating = 0
        else:
            avg_rating = round(float(average), 2)

        restaurant.review_count = aggregate["review_count"] or 0
        restaurant.average_rating = avg_rating
        restaurant.save(update_fields=["review_count", "average_rating", "updated_at"])

    def _update_reaction_counts(self, review):
        review.like_count = ReviewLike.objects.filter(
            review=review, is_like=True
        ).count()
        review.dislike_count = ReviewLike.objects.filter(
            review=review, is_like=False
        ).count()
        review.save(update_fields=["like_count", "dislike_count", "updated_at"])
