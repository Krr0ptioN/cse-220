"""User application services."""

from wireup import injectable

from files.services import FileService
from users.repositories import UserRepository


@injectable
class UserService:
    """Coordinates user endpoint behavior."""

    def __init__(
        self,
        repository: UserRepository | None = None,
        file_service: FileService | None = None,
    ) -> None:
        self.repository = repository or UserRepository()
        self.file_service = file_service or FileService()

    def me(self, user) -> dict[str, str]:
        return self.repository.profile_data(user)

    def update_profile(self, user, data: dict):
        return self.repository.update_profile(user, data)

    def update_avatar(self, user, uploaded_file):
        stored_file_id, _ = self.file_service.save(
            uploaded_file,
            category="avatars",
            entity_id=str(user.id),
            content_type=getattr(uploaded_file, "content_type", "application/octet-stream"),
            generate_thumbnails=True,
        )
        avatar_url = self.file_service.get_obfuscated_url(stored_file_id)
        return self.repository.update_profile(user, {"avatar_url": avatar_url})
