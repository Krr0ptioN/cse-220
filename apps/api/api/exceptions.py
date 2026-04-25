"""API exception helpers and DRF exception formatting."""

from __future__ import annotations

from typing import Any

from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


class ApiError(APIException):
    """Configurable API exception with explicit status and code."""

    status_code = 400
    default_detail = "Request failed."
    default_code = "api_error"

    def __init__(
        self,
        *,
        detail: str | None = None,
        code: str | None = None,
        status_code: int | None = None,
    ) -> None:
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail=detail or self.default_detail, code=code or self.default_code)


def _extract_message(detail: Any) -> str:
    if isinstance(detail, dict):
        if not detail:
            return ""
        first_value = next(iter(detail.values()))
        return _extract_message(first_value)
    if isinstance(detail, list):
        if not detail:
            return ""
        return _extract_message(detail[0])
    return str(detail)


def _extract_code(value: Any) -> str:
    if isinstance(value, dict):
        if not value:
            return "error"
        return _extract_code(next(iter(value.values())))
    if isinstance(value, list):
        if not value:
            return "error"
        return _extract_code(value[0])
    if value in {None, ""}:
        return "error"
    return str(value)


def _resolve_error_code(exc: Exception, response: Response) -> str:
    if isinstance(exc, ValidationError):
        return "validation_error"
    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        return "auth_required"
    if isinstance(exc, PermissionDenied):
        return "forbidden"
    if response.status_code == 404:
        return "not_found"

    if isinstance(exc, APIException):
        return _extract_code(exc.get_codes())

    default_code = getattr(exc, "default_code", None)
    return _extract_code(default_code)


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """Format DRF exceptions using the existing project error schema."""

    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    response.data = {
        "error": {
            "code": _resolve_error_code(exc, response),
            "message": _extract_message(response.data),
        }
    }
    return response
