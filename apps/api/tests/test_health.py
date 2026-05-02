"""Health endpoint tests."""

from django.test import Client


def test_health():
    """Health endpoint returns the expected payload."""
    client = Client()

    response = client.get("/api/v1/health/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "flavormap-api"
