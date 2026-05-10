"""DRF permission classes backed by API policies."""

from __future__ import annotations

from rest_framework.permissions import BasePermission

from api.policies import AccessPolicyManager


class MethodPermissionMixin:
    """Allow views to override permissions per HTTP method."""

    method_permission_classes: dict[str, list[type[BasePermission]]] = {}

    def get_permissions(self):
        permission_classes = self.method_permission_classes.get(
            self.request.method,
            self.permission_classes,
        )
        return [permission() for permission in permission_classes]


class _PolicyPermission(BasePermission):
    policy_method_name = ""
    object_policy_method_name = ""
    message = "Permission denied."

    def _policy(self) -> AccessPolicyManager:
        return AccessPolicyManager()

    def has_permission(self, request, view):
        if not getattr(request.user, "is_authenticated", False):
            return True
        if not self.policy_method_name:
            return True
        decision = getattr(self._policy(), self.policy_method_name)(request.user)
        self.message = decision.reason
        return decision.allowed

    def has_object_permission(self, request, view, obj):
        if not getattr(request.user, "is_authenticated", False):
            return True
        if not self.object_policy_method_name:
            return self.has_permission(request, view)
        decision = getattr(self._policy(), self.object_policy_method_name)(request.user, obj)
        self.message = decision.reason
        return decision.allowed


class CanCreateRestaurant(_PolicyPermission):
    policy_method_name = "can_create_restaurant"


class CanUpdateRestaurant(_PolicyPermission):
    object_policy_method_name = "can_update_restaurant"


class CanDeleteRestaurant(_PolicyPermission):
    object_policy_method_name = "can_delete_restaurant"


class CanManageRestaurantMenu(_PolicyPermission):
    object_policy_method_name = "can_manage_restaurant_menu"


class CanManageRestaurantMedia(_PolicyPermission):
    object_policy_method_name = "can_manage_restaurant_media"


class CanViewOwnerDashboard(_PolicyPermission):
    policy_method_name = "can_view_owner_dashboard"


class CanUseFavorites(_PolicyPermission):
    policy_method_name = "can_view_favorites"


class CanCreateReview(_PolicyPermission):
    policy_method_name = "can_create_review"


class CanUpdateReview(_PolicyPermission):
    object_policy_method_name = "can_update_review"


class CanDeleteReview(_PolicyPermission):
    object_policy_method_name = "can_delete_review"


class CanReactToReview(_PolicyPermission):
    policy_method_name = "can_react_to_review"
