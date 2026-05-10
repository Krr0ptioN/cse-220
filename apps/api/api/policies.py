"""Shared access policy decisions for the API."""

from __future__ import annotations

from dataclasses import dataclass

from restaurants.models import Restaurant
from reviews.models import Review
from users.models import UserRole


@dataclass(frozen=True, slots=True)
class PolicyDecision:
    """A normalized permission outcome."""

    allowed: bool
    reason: str = "Permission denied."


class AccessPolicyManager:
    """Central role and ownership policy evaluator."""

    def can_create_restaurant(self, user) -> PolicyDecision:
        if getattr(user, "is_authenticated", False) and user.role == UserRole.OWNER:
            return PolicyDecision(True)
        return PolicyDecision(False, "Only restaurant owners can create restaurants.")

    def can_update_restaurant(self, user, restaurant: Restaurant) -> PolicyDecision:
        if getattr(user, "is_authenticated", False) and user.role == UserRole.OWNER and restaurant.owner_id == user.id:
            return PolicyDecision(True)
        return PolicyDecision(False, "Only the restaurant owner can update this restaurant.")

    def can_delete_restaurant(self, user, restaurant: Restaurant) -> PolicyDecision:
        if getattr(user, "is_authenticated", False) and user.role == UserRole.ADMIN:
            return PolicyDecision(True)
        return PolicyDecision(False, "Only administrators can delete restaurants.")

    def can_delete_any_restaurant(self, user) -> PolicyDecision:
        if getattr(user, "is_authenticated", False) and user.role == UserRole.ADMIN:
            return PolicyDecision(True)
        return PolicyDecision(False, "Only administrators can delete restaurants.")

    def can_manage_restaurant_menu(self, user, restaurant: Restaurant) -> PolicyDecision:
        if not getattr(user, "is_authenticated", False):
            return PolicyDecision(False, "Authentication is required.")
        if user.role == UserRole.ADMIN or (user.role == UserRole.OWNER and restaurant.owner_id == user.id):
            return PolicyDecision(True)
        return PolicyDecision(False, "Only the restaurant owner or an administrator can manage this menu.")

    def can_manage_restaurant_media(self, user, restaurant: Restaurant) -> PolicyDecision:
        return self.can_manage_restaurant_menu(user, restaurant)

    def can_view_owner_dashboard(self, user) -> PolicyDecision:
        if getattr(user, "is_authenticated", False) and user.role == UserRole.OWNER:
            return PolicyDecision(True)
        return PolicyDecision(False, "Only restaurant owners can view this dashboard.")

    def can_manage_owned_restaurants(self, user) -> PolicyDecision:
        return self.can_view_owner_dashboard(user)

    def can_favorite_restaurant(self, user) -> PolicyDecision:
        if getattr(user, "is_authenticated", False):
            return PolicyDecision(True)
        return PolicyDecision(False, "Authentication is required.")

    def can_view_favorites(self, user) -> PolicyDecision:
        return self.can_favorite_restaurant(user)

    def can_create_review(self, user) -> PolicyDecision:
        if getattr(user, "is_authenticated", False):
            return PolicyDecision(True)
        return PolicyDecision(False, "Authentication is required.")

    def can_update_review(self, user, review: Review) -> PolicyDecision:
        if getattr(user, "is_authenticated", False) and (
            user.role == UserRole.ADMIN or review.user_id == user.id
        ):
            return PolicyDecision(True)
        return PolicyDecision(False, "You can only edit your own reviews.")

    def can_delete_review(self, user, review: Review) -> PolicyDecision:
        if getattr(user, "is_authenticated", False) and (
            user.role == UserRole.ADMIN or review.user_id == user.id
        ):
            return PolicyDecision(True)
        return PolicyDecision(False, "You can only delete your own reviews.")

    def can_react_to_review(self, user) -> PolicyDecision:
        return self.can_create_review(user)
