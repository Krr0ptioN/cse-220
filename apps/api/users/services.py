"""User application services."""

from users.repositories import UserRepository


class UserService:
    """Coordinates user endpoint behavior."""

    repository_class = UserRepository

    def __init__(self, repository: UserRepository | None = None) -> None:
        self.repository = repository or self.repository_class()

    def me(self, user) -> dict[str, str]:
        return self.repository.profile_data(user)

    def update_profile(self, user, data: dict):
        return self.repository.update_profile(user, data)
