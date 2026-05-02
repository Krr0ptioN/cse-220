"""Tests for session-backed authentication endpoints."""

import uuid

import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from users.models import UserRole

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
    suffix = uuid.uuid4().hex[:8]
    user_model = get_user_model()
    user = user_model.objects.create_user(
        email=f"login-{suffix}@example.com",
        username=f"login-{suffix}",
        password="test-password-123",
        display_name="Login User",
        role=UserRole.OWNER,
    )

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
    suffix = uuid.uuid4().hex[:8]
    user_model = get_user_model()
    user_model.objects.create_user(
        email=f"bad-login-{suffix}@example.com",
        username=f"bad-login-{suffix}",
        password="test-password-123",
    )

    response = client.post(
        "/api/v1/auth/login/",
        data={
            "email": f"bad-login-{suffix}@example.com",
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
