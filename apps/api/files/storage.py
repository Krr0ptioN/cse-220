"""File storage backends."""

from __future__ import annotations

import uuid
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import PurePosixPath
from typing import Callable, Protocol

from django.core.files.base import File
from django.core.files.storage import FileSystemStorage
from PIL import Image, UnidentifiedImageError


ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024
DEFAULT_MAX_IMAGE_PIXELS = 20_000_000
SAFE_SEGMENT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")


class UnsupportedFileTypeError(ValueError):
    """Raised when a file content type is not allowed."""


class InvalidStoragePathError(ValueError):
    """Raised when path inputs are unsafe storage segments."""


@dataclass(frozen=True)
class StoredFile:
    path: str
    url: str
    content_type: str
    thumbnails: list[StoredFileThumbnail] = field(default_factory=list)


@dataclass(frozen=True)
class StoredFileThumbnail:
    path: str
    url: str
    size: int


@dataclass(frozen=True)
class PresignedUpload:
    path: str
    url: str
    content_type: str
    max_size: int


class FileStorage(ABC):
    """Abstract storage interface used by FileService."""

    @abstractmethod
    def save(
        self,
        file: File,
        *,
        category: str,
        entity_id: str,
        content_type: str,
        filename: str | None = None,
    ) -> StoredFile:
        raise NotImplementedError

    @abstractmethod
    def save_at_path(self, file: File, *, path: str, content_type: str) -> StoredFile:
        raise NotImplementedError

    @abstractmethod
    def delete(self, path: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_url(self, path: str) -> str:
        raise NotImplementedError

    @abstractmethod
    def exists(self, path: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def create_presigned_upload_url(
        self,
        *,
        category: str,
        entity_id: str,
        filename: str,
        content_type: str,
        expires: timedelta | None = None,
    ) -> PresignedUpload:
        raise NotImplementedError


class MinioClientProtocol(Protocol):
    def put_object(self, bucket_name, object_name, data, length, content_type=None): ...

    def remove_object(self, bucket_name, object_name): ...

    def stat_object(self, bucket_name, object_name): ...

    def presigned_get_object(self, bucket_name, object_name, expires=None): ...

    def presigned_put_object(self, bucket_name, object_name, expires=None): ...


def _default_uuid() -> str:
    return str(uuid.uuid4())


def _validate_image_type(content_type: str) -> str:
    extension = ALLOWED_IMAGE_CONTENT_TYPES.get(content_type.lower())
    if extension is None:
        raise UnsupportedFileTypeError(f"Unsupported file type: {content_type}")
    return extension


def _validate_file_size(file: File, max_size: int) -> None:
    size = getattr(file, "size", None)
    if size is not None and size > max_size:
        raise UnsupportedFileTypeError("File exceeds maximum upload size")


def _validate_image_file(
    file: File,
    content_type: str,
    max_size: int,
    max_pixels: int,
) -> None:
    _validate_file_size(file, max_size)
    _validate_image_type(content_type)
    try:
        file.seek(0)
        with Image.open(file) as image:
            if image.width * image.height > max_pixels:
                raise UnsupportedFileTypeError("Image exceeds maximum pixel count")
            image.verify()
    except (OSError, UnidentifiedImageError) as exc:
        raise UnsupportedFileTypeError("Invalid image file") from exc
    finally:
        file.seek(0)


def _is_missing_object_error(error: Exception) -> bool:
    if isinstance(error, FileNotFoundError):
        return True
    code = getattr(error, "code", None)
    return code in {"NoSuchKey", "NoSuchBucket", "NoSuchObject"}


def _build_object_path(
    *,
    category: str,
    entity_id: str,
    content_type: str,
    today: date,
    uuid_value: str,
) -> str:
    extension = _validate_image_type(content_type)
    _validate_safe_segment(category, "category")
    _validate_safe_segment(entity_id, "entity_id")
    return str(
        PurePosixPath(
            category,
            entity_id,
            f"{today:%Y}",
            f"{today:%m}",
            f"{today:%d}",
            f"{uuid_value}{extension}",
        )
    )


def _validate_safe_segment(value: str, name: str) -> None:
    if not value or not SAFE_SEGMENT_RE.fullmatch(value):
        raise InvalidStoragePathError(f"Invalid {name}: {value}")


class LocalFileStorage(FileStorage):
    def __init__(
        self,
        *,
        storage: FileSystemStorage,
        max_size: int = DEFAULT_MAX_FILE_SIZE,
        max_pixels: int = DEFAULT_MAX_IMAGE_PIXELS,
        today: Callable[[], date] = date.today,
        uuid_factory: Callable[[], str] = _default_uuid,
    ) -> None:
        self.storage = storage
        self.max_size = max_size
        self.max_pixels = max_pixels
        self.today = today
        self.uuid_factory = uuid_factory

    def save(
        self,
        file: File,
        *,
        category: str,
        entity_id: str,
        content_type: str,
        filename: str | None = None,
    ) -> StoredFile:
        _validate_image_file(file, content_type, self.max_size, self.max_pixels)
        path = self.build_path(category=category, entity_id=entity_id, content_type=content_type)
        saved_path = self.storage.save(path, file)
        return StoredFile(
            path=saved_path,
            url=self.get_url(saved_path),
            content_type=content_type,
        )

    def save_at_path(self, file: File, *, path: str, content_type: str) -> StoredFile:
        _validate_image_file(file, content_type, self.max_size, self.max_pixels)
        saved_path = self.storage.save(path, file)
        return StoredFile(
            path=saved_path,
            url=self.get_url(saved_path),
            content_type=content_type,
        )

    def build_path(self, *, category: str, entity_id: str, content_type: str) -> str:
        return _build_object_path(
            category=category,
            entity_id=entity_id,
            content_type=content_type,
            today=self.today(),
            uuid_value=self.uuid_factory(),
        )

    def delete(self, path: str) -> None:
        if self.storage.exists(path):
            self.storage.delete(path)

    def get_url(self, path: str) -> str:
        return self.storage.url(path)

    def exists(self, path: str) -> bool:
        return self.storage.exists(path)

    def create_presigned_upload_url(
        self,
        *,
        category: str,
        entity_id: str,
        filename: str,
        content_type: str,
        expires: timedelta | None = None,
    ) -> PresignedUpload:
        raise NotImplementedError("Presigned direct uploads require the MinIO backend.")


class MinioStorage(FileStorage):
    def __init__(
        self,
        *,
        client: MinioClientProtocol,
        bucket_name: str,
        max_size: int = DEFAULT_MAX_FILE_SIZE,
        max_pixels: int = DEFAULT_MAX_IMAGE_PIXELS,
        today: Callable[[], date] = date.today,
        uuid_factory: Callable[[], str] = _default_uuid,
    ) -> None:
        self.client = client
        self.bucket_name = bucket_name
        self.max_size = max_size
        self.max_pixels = max_pixels
        self.today = today
        self.uuid_factory = uuid_factory

    def save(
        self,
        file: File,
        *,
        category: str,
        entity_id: str,
        content_type: str,
        filename: str | None = None,
    ) -> StoredFile:
        _validate_image_file(file, content_type, self.max_size, self.max_pixels)
        path = self.build_path(category=category, entity_id=entity_id, content_type=content_type)
        file.seek(0)
        self.client.put_object(
            self.bucket_name,
            path,
            file,
            file.size,
            content_type=content_type,
        )
        return StoredFile(path=path, url=self.get_url(path), content_type=content_type)

    def save_at_path(self, file: File, *, path: str, content_type: str) -> StoredFile:
        _validate_image_file(file, content_type, self.max_size, self.max_pixels)
        file.seek(0)
        self.client.put_object(
            self.bucket_name,
            path,
            file,
            file.size,
            content_type=content_type,
        )
        return StoredFile(path=path, url=self.get_url(path), content_type=content_type)

    def build_path(self, *, category: str, entity_id: str, content_type: str) -> str:
        return _build_object_path(
            category=category,
            entity_id=entity_id,
            content_type=content_type,
            today=self.today(),
            uuid_value=self.uuid_factory(),
        )

    def delete(self, path: str) -> None:
        self.client.remove_object(self.bucket_name, path)

    def get_url(self, path: str) -> str:
        return self.client.presigned_get_object(self.bucket_name, path)

    def exists(self, path: str) -> bool:
        try:
            self.client.stat_object(self.bucket_name, path)
        except Exception as exc:
            if _is_missing_object_error(exc):
                return False
            raise
        return True

    def create_presigned_upload_url(
        self,
        *,
        category: str,
        entity_id: str,
        filename: str,
        content_type: str,
        expires: timedelta | None = None,
    ) -> PresignedUpload:
        path = self.build_path(category=category, entity_id=entity_id, content_type=content_type)
        url = self.client.presigned_put_object(self.bucket_name, path, expires=expires)
        return PresignedUpload(
            path=path,
            url=url,
            content_type=content_type,
            max_size=self.max_size,
        )
