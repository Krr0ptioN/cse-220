"""File application repositories."""

from __future__ import annotations

from uuid import UUID
from files.models import StoredFile


class FileRepository:
    """Handles database operations for stored files."""

    model = StoredFile

    def create(self, *, path: str, category: str, entity_id: str, content_type: str, size: int | None = None) -> StoredFile:
        return self.model.objects.create(
            path=path,
            category=category,
            entity_id=entity_id,
            content_type=content_type,
            size=size,
        )

    def get_by_id(self, file_id: str | UUID) -> StoredFile | None:
        try:
            return self.model.objects.get(id=file_id)
        except (self.model.DoesNotExist, ValueError):
            return None

    def delete(self, file_id: str | UUID) -> None:
        self.model.objects.filter(id=file_id).delete()
