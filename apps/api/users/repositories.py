"""User data access layer."""


class UserRepository:
    """Repository for user-related read operations."""

    def profile_data(self, user) -> dict[str, str]:
        return {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "display_name": user.display_name,
            "role": user.role,
        }
