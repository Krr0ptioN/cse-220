"""HTTP response classes used by api_http controllers."""

from __future__ import annotations

from typing import Any

from django.http import HttpResponse, JsonResponse


class JsonApiResponse(JsonResponse):
    """Base JSON response with consistent safe-mode behavior."""

    def __init__(
        self,
        payload: Any,
        *,
        status: int = 200,
        headers: dict[str, str] | None = None,
    ):
        super().__init__(
            payload,
            status=status,
            headers=headers,
            safe=isinstance(payload, dict),
        )


class OkResponse(JsonApiResponse):
    """JSON response for successful requests (HTTP 200)."""

    def __init__(self, payload: Any, *, headers: dict[str, str] | None = None):
        super().__init__(payload, status=200, headers=headers)


class CreatedResponse(JsonApiResponse):
    """JSON response for resource creation (HTTP 201)."""

    def __init__(self, payload: Any, *, headers: dict[str, str] | None = None):
        super().__init__(payload, status=201, headers=headers)


class ErrorResponse(JsonApiResponse):
    """Standardized JSON error response payload."""

    def __init__(
        self,
        *,
        status: int,
        error_code: str,
        message: str,
        details: Any | None = None,
        headers: dict[str, str] | None = None,
    ):
        payload: dict[str, Any] = {
            "error": {
                "code": error_code,
                "message": message,
            }
        }
        if details is not None:
            payload["error"]["details"] = details

        super().__init__(payload, status=status, headers=headers)


class NoContentResponse(HttpResponse):
    """No-content response for successful requests (HTTP 204)."""

    def __init__(self, *, headers: dict[str, str] | None = None):
        super().__init__(status=204, headers=headers)
