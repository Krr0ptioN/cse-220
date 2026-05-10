"""Views for review endpoints."""

from rest_framework.response import Response
from rest_framework.views import APIView
from wireup import Injected
from wireup.integration.django import inject

from api.rest import api_data, api_paginated, paginate_queryset, require_authenticated_user
from api.permissions import (
    CanCreateReview,
    CanDeleteReview,
    CanReactToReview,
    CanUpdateReview,
    MethodPermissionMixin,
)
from reviews.serializers import ReviewCreateSerializer, ReviewSerializer, ReviewUpdateSerializer
from reviews.services import ReviewService


class ReviewController(MethodPermissionMixin, APIView):
    """Return, update, or delete a single review by ID."""

    method_permission_classes = {
        "PATCH": [CanUpdateReview],
        "DELETE": [CanDeleteReview],
    }

    @inject
    def get(self, request, review_id, service: Injected[ReviewService]):
        review = service.get_review(review_id)
        return api_data(ReviewSerializer(review).data)

    @inject
    def patch(self, request, review_id, service: Injected[ReviewService]):
        review = service.get_review(review_id)
        self.check_object_permissions(request, review)
        user = require_authenticated_user(request)
        serializer = ReviewUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = service.update_review(user=user, review=review, data=serializer.validated_data)
        return api_data(ReviewSerializer(review).data)

    @inject
    def delete(self, request, review_id, service: Injected[ReviewService]):
        review = service.get_review(review_id)
        self.check_object_permissions(request, review)
        user = require_authenticated_user(request)
        service.delete_review(user=user, review=review)
        return Response(status=204)


class RestaurantReviewsController(MethodPermissionMixin, APIView):
    """List or create reviews for a restaurant."""

    method_permission_classes = {
        "POST": [CanCreateReview],
    }

    @inject
    def get(self, request, restaurant_slug, service: Injected[ReviewService]):
        restaurant = service.get_restaurant(restaurant_slug)
        sort = request.query_params.get("sort", "recent")
        queryset = service.list_restaurant_reviews(restaurant, sort=sort)
        page_obj, pagination = paginate_queryset(queryset, request)
        user_reactions = {}
        if request.user.is_authenticated:
            user_reactions = service.repository.get_user_reactions_for_restaurant(
                user=request.user, restaurant=restaurant
            )
        serializer = ReviewSerializer(
            page_obj.object_list,
            many=True,
            context={"user_reactions": user_reactions},
        )
        return api_paginated(serializer.data, pagination)


        
    @inject
    def post(self, request, restaurant_slug, service: Injected[ReviewService]):
        restaurant = service.get_restaurant(restaurant_slug)
        user = require_authenticated_user(request)
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = service.create_review(
            restaurant=restaurant,
            user=user,
            data=serializer.validated_data,
        )
        return api_data(ReviewSerializer(review).data, status_code=201)


class ReviewLikeController(MethodPermissionMixin, APIView):
    """Like or unlike a review."""

    method_permission_classes = {
        "POST": [CanReactToReview],
        "DELETE": [CanReactToReview],
    }

    @inject
    def post(self, request, review_id, service: Injected[ReviewService]):
        user = require_authenticated_user(request)
        review = service.get_review(review_id)
        self.check_object_permissions(request, review)
        return api_data(service.set_reaction(user=user, review=review, is_like=True))

    @inject
    def delete(self, request, review_id, service: Injected[ReviewService]):
        user = require_authenticated_user(request)
        review = service.get_review(review_id)
        self.check_object_permissions(request, review)
        return api_data(service.delete_reaction(user=user, review=review, is_like=True))


class ReviewDislikeController(MethodPermissionMixin, APIView):
    """Dislike or remove dislike from a review."""

    method_permission_classes = {
        "POST": [CanReactToReview],
        "DELETE": [CanReactToReview],
    }

    @inject
    def post(self, request, review_id, service: Injected[ReviewService]):
        user = require_authenticated_user(request)
        review = service.get_review(review_id)
        self.check_object_permissions(request, review)
        return api_data(service.set_reaction(user=user, review=review, is_like=False))

    @inject
    def delete(self, request, review_id, service: Injected[ReviewService]):
        user = require_authenticated_user(request)
        review = service.get_review(review_id)
        self.check_object_permissions(request, review)
        return api_data(service.delete_reaction(user=user, review=review, is_like=False))
    

class ReviewRepliesController(MethodPermissionMixin, APIView):
    """Create a reply to a review."""

    method_permission_classes = {
        "POST": [CanCreateReview],
    }

    @inject
    def post(self, request, review_id, service: Injected[ReviewService]):
        review = service.get_review(review_id)
        user = require_authenticated_user(request)
        self.check_object_permissions(request, review)
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reply = service.create_review(
            restaurant=review.restaurant,
            user=user,
            data={**serializer.validated_data, "parent_id": review.id},
        )
        return api_data(ReviewSerializer(reply).data, status_code=201)
