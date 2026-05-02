"""Unit tests for controller routing helpers."""

import json

from django.test import RequestFactory

from api_http import (
    Controller,
    ValidationError,
    build_urlpatterns,
    controller,
    get,
    use,
)


def test_build_urlpatterns_registers_get_route() -> None:
    @controller()
    class HealthController(Controller):
        @get()
        def health(self):
            return self.ok({"status": "ok"})

    urlpatterns = build_urlpatterns(HealthController)

    assert len(urlpatterns) == 1
    response = urlpatterns[0].callback(RequestFactory().get("/health/"))

    assert response.status_code == 200
    payload = json.loads(response.content)
    assert payload["status"] == "ok"


def test_get_route_rejects_non_get_methods() -> None:
    @controller()
    class HealthController(Controller):
        @get()
        def health(self):
            return self.ok({"status": "ok"})

    view = build_urlpatterns(HealthController)[0].callback
    response = view(RequestFactory().post("/health/"))

    assert response.status_code == 405


def test_use_applies_decorators_to_generated_view() -> None:
    def add_header(view):
        def wrapper(request, *args, **kwargs):
            response = view(request, *args, **kwargs)
            response["X-Controller"] = "api-http"
            return response

        return wrapper

    @controller("v1")
    class DecoratedController(Controller):
        @use(add_header)
        @get("ping/")
        def ping(self):
            return self.ok({"ok": True})

    urlpatterns = build_urlpatterns(DecoratedController)

    assert str(urlpatterns[0].pattern) == "v1/ping/"

    response = urlpatterns[0].callback(RequestFactory().get("/v1/ping/"))
    assert response.status_code == 200
    assert response["X-Controller"] == "api-http"


def test_api_http_error_is_formatted_as_json_response() -> None:
    @controller()
    class ProtectedController(Controller):
        @get()
        def me(self):
            raise ValidationError(details={"field": "email"})

    view = build_urlpatterns(ProtectedController)[0].callback
    response = view(RequestFactory().get("/me/"))

    assert response.status_code == 400
    payload = json.loads(response.content)
    assert payload["error"]["code"] == "validation_error"
    assert payload["error"]["details"] == {"field": "email"}


def test_invalid_controller_return_type_is_formatted_error() -> None:
    @controller()
    class InvalidController(Controller):
        @get()
        def bad(self):
            return {"status": "ok"}

    view = build_urlpatterns(InvalidController)[0].callback
    response = view(RequestFactory().get("/bad/"))

    assert response.status_code == 500
    payload = json.loads(response.content)
    assert payload["error"]["code"] == "invalid_controller_response"
