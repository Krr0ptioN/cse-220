"""Tests for session-backed authentication endpoints."""

import uuid

import pytest
from django.test import Client

from users.models import UserRole
from tests.factories import create_image_upload as _image_upload
from tests.factories import create_user as _create_user

pytestmark = pytest.mark.django_db


def test_register_creates_owner_session():
    client = Client()
    suffix = uuid.uuid4().hex[:8]

    response = client.post(
        "/api/v1/auth/register/",
        data={
            "email": f"owner-{suffix}@example.com",
            "username": f"owner-{suffix}",
            "password": "owner-password-123",
            "display_name": "Owner Example",
            "role": UserRole.OWNER,
        },
        content_type="application/json",
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["data"]["role"] == UserRole.OWNER
    assert payload["data"]["email"] == f"owner-{suffix}@example.com"

    me_response = client.get("/api/v1/auth/me/")
    assert me_response.status_code == 200
    assert me_response.json()["data"]["role"] == UserRole.OWNER


def test_register_defaults_to_user_role():
    client = Client()
    suffix = uuid.uuid4().hex[:8]

    response = client.post(
        "/api/v1/auth/register/",
        data={
            "email": f"reviewer-{suffix}@example.com",
            "username": f"reviewer-{suffix}",
            "password": "reviewer-password-123",
            "display_name": "Reviewer Example",
        },
        content_type="application/json",
    )

    assert response.status_code == 201
    assert response.json()["data"]["role"] == UserRole.USER


def test_login_creates_session_and_logout_clears_it():
    client = Client()
    user = _create_user(role=UserRole.OWNER, prefix="login", display_name="Login User")

    response = client.post(
        "/api/v1/auth/login/",
        data={"email": user.email, "password": "test-password-123"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["id"] == str(user.id)
    assert client.get("/api/v1/auth/me/").status_code == 200

    logout_response = client.post("/api/v1/auth/logout/")
    assert logout_response.status_code == 204
    assert client.get("/api/v1/auth/me/").status_code == 401


def test_login_rejects_bad_credentials():
    client = Client()
    user = _create_user(prefix="bad-login")

    response = client.post(
        "/api/v1/auth/login/",
        data={
            "email": user.email,
            "password": "wrong-password",
        },
        content_type="application/json",
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


def test_csrf_endpoint_sets_token_cookie():
    client = Client(enforce_csrf_checks=True)

    response = client.get("/api/v1/auth/csrf/")

    assert response.status_code == 200
    assert response.json()["data"]["csrf_token"]
    assert "csrftoken" in client.cookies


def test_user_profile_endpoint_returns_profile_fields():
    client = Client()
    user = _create_user(prefix="profile-read", display_name="Profile Reader")
    user.bio = "Tracks weekend brunch spots."
    user.avatar_url = "https://example.com/avatar.png"
    user.save(update_fields=["bio", "avatar_url"])
    client.force_login(user)

    response = client.get("/api/v1/users/me/")

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["email"] == user.email
    assert payload["display_name"] == "Profile Reader"
    assert payload["bio"] == "Tracks weekend brunch spots."
    assert payload["avatar_url"] == "https://example.com/avatar.png"
    assert payload["created_at"]
    assert payload["updated_at"]


def test_user_profile_patch_updates_editable_fields():
    client = Client()
    user = _create_user(prefix="profile-update", display_name="Before Update")
    client.force_login(user)
    new_username = f"profile-updated-{uuid.uuid4().hex[:8]}"

    response = client.patch(
        "/api/v1/users/me/",
        data={
            "username": new_username,
            "display_name": "After Update",
            "bio": "Updated public bio.",
            "avatar_url": "https://example.com/updated-avatar.png",
            "role": UserRole.ADMIN,
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["username"] == new_username
    assert payload["display_name"] == "After Update"
    assert payload["bio"] == "Updated public bio."
    assert payload["avatar_url"] == "https://example.com/updated-avatar.png"
    assert payload["role"] == UserRole.USER

    user.refresh_from_db()
    assert user.username == new_username
    assert user.display_name == "After Update"
    assert user.role == UserRole.USER


def test_user_profile_patch_rejects_duplicate_username():
    client = Client()
    existing_user = _create_user(prefix="profile-existing")
    user = _create_user(prefix="profile-duplicate")
    client.force_login(user)

    response = client.patch(
        "/api/v1/users/me/",
        data={"username": existing_user.username},
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"


def test_user_profile_avatar_upload_stores_image_and_updates_avatar_url():
    client = Client()
    user = _create_user(prefix="profile-avatar", display_name="Avatar User")
    client.force_login(user)

    response = client.post(
        "/api/v1/users/me/avatar/",
        data={"avatar": _image_upload("avatar.png")},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["id"] == str(user.id)
    assert payload["avatar_url"].startswith("/api/v1/files/")

    user.refresh_from_db()
    assert user.avatar_url == payload["avatar_url"]


def test_user_profile_avatar_upload_requires_image_file():
    client = Client()
    user = _create_user(prefix="profile-avatar-invalid")
    client.force_login(user)

    response = client.post(
        "/api/v1/users/me/avatar/",
        data={"avatar": "not an image"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"
