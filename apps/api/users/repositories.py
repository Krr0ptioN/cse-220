"""User data access layer."""

from __future__ import annotations

from wireup import injectable


@injectable
class UserRepository:
    """Repository for user-related read operations."""

    def profile_data(self, user) -> dict[str, str]:
        return {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "display_name": user.display_name,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        }

    def update_profile(self, user, data: dict):
        editable_fields = ("username", "display_name", "bio", "avatar_url")
        update_fields = []

        for field in editable_fields:
            if field in data:
                setattr(user, field, data[field])
                update_fields.append(field)

        if update_fields:
            user.save(update_fields=[*update_fields, "updated_at"])

        return user
