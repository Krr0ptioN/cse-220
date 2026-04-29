"""File application service."""

from __future__ import annotations

import io
from pathlib import PurePosixPath

from django.conf import settings
from django.core.files.base import ContentFile, File
from django.core.files.storage import FileSystemStorage
from PIL import Image

from files.storage import (
    DEFAULT_MAX_FILE_SIZE,
    DEFAULT_MAX_IMAGE_PIXELS,
    FileStorage,
    LocalFileStorage,
    MinioStorage,
    StoredFile,
    StoredFileThumbnail,
)


class FileService:
    def __init__(self, *, storage: FileStorage, thumbnail_sizes: tuple[int, ...] = (64, 128, 256)) -> None:
        self.storage = storage
        self.thumbnail_sizes = thumbnail_sizes

    def save(
        self,
        file: File,
        *,
        category: str,
        entity_id: str,
        content_type: str,
        generate_thumbnails: bool = False,
    ) -> StoredFile:
        stored = self.storage.save(
            file,
            category=category,
            entity_id=entity_id,
            content_type=content_type,
        )
        if not generate_thumbnails:
            return stored

        try:
            thumbnails = self._generate_thumbnails(
                file,
                source_path=stored.path,
                content_type=content_type,
            )
        except Exception:
            self.delete(stored.path)
            raise
        return StoredFile(
            path=stored.path,
            url=stored.url,
            content_type=stored.content_type,
            thumbnails=thumbnails,
        )

    def delete(self, path: str) -> None:
        self.storage.delete(path)
        parent = PurePosixPath(path).parent
        stem = PurePosixPath(path).stem
        for size in self.thumbnail_sizes:
            self.storage.delete(str(PurePosixPath(parent, "thumbnails", f"{stem}_{size}.jpg")))

    def get_url(self, path: str) -> str:
        return self.storage.get_url(path)

    def exists(self, path: str) -> bool:
        return self.storage.exists(path)

    def create_presigned_upload_url(self, **kwargs):
        return self.storage.create_presigned_upload_url(**kwargs)

    def _generate_thumbnails(
        self,
        file: File,
        *,
        source_path: str,
        content_type: str,
    ) -> list[StoredFileThumbnail]:
        thumbnails: list[StoredFileThumbnail] = []
        file.seek(0)
        with Image.open(file) as source:
            source = source.convert("RGB")
            for size in self.thumbnail_sizes:
                image = source.copy()
                image.thumbnail((size, size))
                canvas = Image.new("RGB", (size, size), color=(255, 255, 255))
                left = (size - image.width) // 2
                top = (size - image.height) // 2
                canvas.paste(image, (left, top))

                buffer = io.BytesIO()
                canvas.save(buffer, format="JPEG", quality=85)
                buffer.seek(0)

                thumb_path = str(
                    PurePosixPath(
                        PurePosixPath(source_path).parent,
                        "thumbnails",
                        f"{PurePosixPath(source_path).stem}_{size}.jpg",
                    )
                )
                self.storage.delete(thumb_path)
                saved = self.storage.save_at_path(
                    ContentFile(buffer.read(), name=PurePosixPath(thumb_path).name),
                    path=thumb_path,
                    content_type="image/jpeg",
                )
                thumbnails.append(
                    StoredFileThumbnail(
                        path=saved.path,
                        url=saved.url,
                        size=size,
                    )
                )
        return thumbnails


def create_file_service() -> FileService:
    backend = getattr(settings, "FILE_STORAGE_BACKEND", "local").lower()
    thumbnail_sizes = tuple(getattr(settings, "FILE_STORAGE_THUMBNAIL_SIZES", (64, 128, 256)))

    if backend == "local":
        storage = LocalFileStorage(
            storage=FileSystemStorage(
                location=getattr(settings, "FILE_STORAGE_LOCAL_ROOT", settings.MEDIA_ROOT),
                base_url=getattr(settings, "FILE_STORAGE_LOCAL_URL", settings.MEDIA_URL),
            ),
            max_size=getattr(settings, "FILE_STORAGE_MAX_SIZE", DEFAULT_MAX_FILE_SIZE),
            max_pixels=getattr(
                settings,
                "FILE_STORAGE_MAX_IMAGE_PIXELS",
                DEFAULT_MAX_IMAGE_PIXELS,
            ),
        )
        return FileService(storage=storage, thumbnail_sizes=thumbnail_sizes)

    if backend == "minio":
        from minio import Minio

        storage = MinioStorage(
            client=Minio(
                getattr(settings, "MINIO_ENDPOINT"),
                access_key=getattr(settings, "MINIO_ACCESS_KEY"),
                secret_key=getattr(settings, "MINIO_SECRET_KEY"),
                secure=getattr(settings, "MINIO_SECURE", False),
            ),
            bucket_name=getattr(settings, "MINIO_BUCKET_NAME"),
            max_size=getattr(settings, "FILE_STORAGE_MAX_SIZE", DEFAULT_MAX_FILE_SIZE),
            max_pixels=getattr(
                settings,
                "FILE_STORAGE_MAX_IMAGE_PIXELS",
                DEFAULT_MAX_IMAGE_PIXELS,
            ),
        )
        return FileService(storage=storage, thumbnail_sizes=thumbnail_sizes)

    raise ValueError(f"Unknown FILE_STORAGE_BACKEND: {backend}")
