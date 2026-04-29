"""Tests for file storage backends and service."""

from __future__ import annotations

import io
from datetime import date
from pathlib import Path

import pytest
from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage
from django.test import override_settings
from PIL import Image

from files.services import FileService, create_file_service
from files.storage import InvalidStoragePathError, LocalFileStorage, MinioStorage, UnsupportedFileTypeError


def _image_file(format_name: str = "PNG") -> ContentFile:
    buffer = io.BytesIO()
    Image.new("RGB", (512, 384), color=(20, 40, 60)).save(buffer, format=format_name)
    buffer.seek(0)
    return ContentFile(buffer.read(), name=f"sample.{format_name.lower()}")


def _sized_image_file(size: tuple[int, int]) -> ContentFile:
    buffer = io.BytesIO()
    Image.new("RGB", size, color=(20, 40, 60)).save(buffer, format="PNG")
    buffer.seek(0)
    return ContentFile(buffer.read(), name="sample.png")


def test_local_storage_saves_images_under_categorized_uuid_path(tmp_path):
    storage = LocalFileStorage(
        storage=FileSystemStorage(location=tmp_path, base_url="/media/"),
        today=lambda: date(2026, 4, 29),
        uuid_factory=lambda: "file-id",
    )

    stored = storage.save(
        _image_file(),
        category="avatars",
        entity_id="user-123",
        content_type="image/png",
    )

    assert stored.path == "avatars/user-123/2026/04/29/file-id.png"
    assert (tmp_path / stored.path).exists()
    assert storage.exists(stored.path)
    assert storage.get_url(stored.path) == "/media/avatars/user-123/2026/04/29/file-id.png"


def test_local_storage_rejects_non_images(tmp_path):
    storage = LocalFileStorage(storage=FileSystemStorage(location=tmp_path))

    with pytest.raises(UnsupportedFileTypeError):
        storage.save(
            ContentFile(b"not an image", name="sample.txt"),
            category="avatars",
            entity_id="user-123",
            content_type="text/plain",
        )


def test_local_storage_rejects_oversized_files(tmp_path):
    file = _image_file()
    storage = LocalFileStorage(storage=FileSystemStorage(location=tmp_path), max_size=file.size - 1)

    with pytest.raises(UnsupportedFileTypeError):
        storage.save(
            file,
            category="avatars",
            entity_id="user-123",
            content_type="image/png",
        )


def test_local_storage_rejects_images_over_pixel_limit(tmp_path):
    storage = LocalFileStorage(storage=FileSystemStorage(location=tmp_path), max_pixels=10)

    with pytest.raises(UnsupportedFileTypeError):
        storage.save(
            _sized_image_file((4, 4)),
            category="avatars",
            entity_id="user-123",
            content_type="image/png",
        )


def test_local_storage_rejects_unsafe_path_segments(tmp_path):
    storage = LocalFileStorage(storage=FileSystemStorage(location=tmp_path))

    with pytest.raises(InvalidStoragePathError):
        storage.save(
            _image_file(),
            category="../avatars",
            entity_id="user-123",
            content_type="image/png",
        )


def test_local_storage_rejects_invalid_image_bytes(tmp_path):
    storage = LocalFileStorage(storage=FileSystemStorage(location=tmp_path))

    with pytest.raises(UnsupportedFileTypeError):
        storage.save(
            ContentFile(b"not an image", name="sample.png"),
            category="avatars",
            entity_id="user-123",
            content_type="image/png",
        )

    assert not any(tmp_path.rglob("*.png"))


@pytest.mark.django_db
def test_file_service_generates_thumbnails_for_local_images(tmp_path):
    storage = LocalFileStorage(
        storage=FileSystemStorage(location=tmp_path, base_url="/media/"),
        today=lambda: date(2026, 4, 29),
        uuid_factory=lambda: "file-id",
    )
    service = FileService(storage=storage, thumbnail_sizes=(64, 128, 256))

    file_id, stored = service.save(
        _image_file(),
        category="restaurants",
        entity_id="restaurant-1",
        content_type="image/png",
        generate_thumbnails=True,
    )

    assert [thumb.size for thumb in stored.thumbnails] == [64, 128, 256]
    for thumb in stored.thumbnails:
        assert (tmp_path / thumb.path).exists()
        with Image.open(tmp_path / thumb.path) as image:
            assert image.size == (thumb.size, thumb.size)


@pytest.mark.django_db
def test_file_service_delete_removes_thumbnail_derivatives(tmp_path):
    storage = LocalFileStorage(
        storage=FileSystemStorage(location=tmp_path, base_url="/media/"),
        today=lambda: date(2026, 4, 29),
        uuid_factory=lambda: "file-id",
    )
    service = FileService(storage=storage, thumbnail_sizes=(64, 128, 256))
    file_id, stored = service.save(
        _image_file(),
        category="restaurants",
        entity_id="restaurant-1",
        content_type="image/png",
        generate_thumbnails=True,
    )

    service.delete_by_id(file_id)

    assert not (tmp_path / stored.path).exists()
    for thumb in stored.thumbnails:
        assert not (tmp_path / thumb.path).exists()


@pytest.mark.django_db
def test_file_service_cleans_original_when_thumbnail_generation_fails(tmp_path):
    storage = LocalFileStorage(
        storage=FileSystemStorage(location=tmp_path, base_url="/media/"),
        today=lambda: date(2026, 4, 29),
        uuid_factory=lambda: "file-id",
    )
    class FailingThumbnailService(FileService):
        def _generate_thumbnails(self, file, *, source_path, content_type):
            raise RuntimeError("thumbnail failed")

    service = FailingThumbnailService(storage=storage, thumbnail_sizes=(64,))

    with pytest.raises(RuntimeError):
        service.save(
            _image_file(),
            category="restaurants",
            entity_id="restaurant-1",
            content_type="image/png",
            generate_thumbnails=True,
        )

    assert not (tmp_path / "restaurants/restaurant-1/2026/04/29/file-id.png").exists()


def test_local_storage_does_not_fake_presigned_upload_urls(tmp_path):
    storage = LocalFileStorage(storage=FileSystemStorage(location=tmp_path))

    with pytest.raises(NotImplementedError):
        storage.create_presigned_upload_url(
            category="avatars",
            entity_id="user-123",
            filename="avatar.png",
            content_type="image/png",
        )


class FakeMinioClient:
    def __init__(self):
        self.objects: dict[tuple[str, str], bytes] = {}
        self.removed: list[tuple[str, str]] = []
        self.presign_calls: list[tuple[str, str, object]] = []

    def put_object(self, bucket_name, object_name, data, length, content_type=None):
        self.objects[(bucket_name, object_name)] = data.read(length)

    def remove_object(self, bucket_name, object_name):
        self.removed.append((bucket_name, object_name))
        self.objects.pop((bucket_name, object_name), None)

    def stat_object(self, bucket_name, object_name):
        if (bucket_name, object_name) not in self.objects:
            raise FileNotFoundError(object_name)
        return object()

    def presigned_get_object(self, bucket_name, object_name, expires=None):
        return f"https://storage.local/{bucket_name}/{object_name}?download=1"

    def presigned_put_object(self, bucket_name, object_name, expires=None):
        self.presign_calls.append((bucket_name, object_name, expires))
        return f"https://storage.local/{bucket_name}/{object_name}?upload=1"


def test_minio_storage_saves_and_generates_presigned_put_url():
    client = FakeMinioClient()
    storage = MinioStorage(
        client=client,
        bucket_name="uploads",
        today=lambda: date(2026, 4, 29),
        uuid_factory=lambda: "file-id",
    )

    stored = storage.save(
        _image_file("JPEG"),
        category="gallery",
        entity_id="restaurant-1",
        content_type="image/jpeg",
    )
    upload = storage.create_presigned_upload_url(
        category="gallery",
        entity_id="restaurant-1",
        filename="menu.webp",
        content_type="image/webp",
    )

    assert stored.path == "gallery/restaurant-1/2026/04/29/file-id.jpg"
    assert client.objects[("uploads", stored.path)]
    assert storage.exists(stored.path)
    assert storage.get_url(stored.path).endswith("?download=1")
    assert upload.path == "gallery/restaurant-1/2026/04/29/file-id.webp"
    assert upload.url.endswith("?upload=1")
    assert upload.max_size == storage.max_size


def test_minio_exists_propagates_operational_errors():
    class BrokenMinioClient(FakeMinioClient):
        def stat_object(self, bucket_name, object_name):
            raise RuntimeError("network down")

    storage = MinioStorage(client=BrokenMinioClient(), bucket_name="uploads")

    with pytest.raises(RuntimeError):
        storage.exists("avatars/user-123/2026/04/29/file-id.png")


@pytest.mark.django_db
def test_file_service_can_be_created_from_settings(tmp_path):
    with override_settings(
        FILE_STORAGE_BACKEND="local",
        FILE_STORAGE_LOCAL_ROOT=tmp_path,
        FILE_STORAGE_LOCAL_URL="/uploads/",
    ):
        service = create_file_service()

    file_id, stored = service.save(
        _image_file(),
        category="avatars",
        entity_id="user-123",
        content_type="image/png",
        generate_thumbnails=False,
    )

    assert isinstance(service.storage, LocalFileStorage)
    assert Path(tmp_path, stored.path).exists()
