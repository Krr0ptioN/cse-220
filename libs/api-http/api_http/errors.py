"""Error classes for controller-level error handling."""

from __future__ import annotations

from typing import Any

from .responses import ErrorResponse


class ApiHttpError(Exception):
    """Base exception used for standardized API error responses."""

    status_code = 500
    error_code = "api_http_error"
    default_message = "An unexpected API error occurred."

    def __init__(
        self,
        message: str | None = None,
        *,
        details: Any | None = None,
        status_code: int | None = None,
        error_code: str | None = None,
        headers: dict[str, str] | None = None,
    ):
        self.message = message or self.default_message
        self.details = details
        self.status_code = status_code or self.status_code
        self.error_code = error_code or self.error_code
        self.headers = headers
        super().__init__(self.message)

    def to_response(self) -> ErrorResponse:
        """Convert exception into a standardized HTTP response."""

        return ErrorResponse(
            status=self.status_code,
            error_code=self.error_code,
            message=self.message,
            details=self.details,
            headers=self.headers,
        )


class RouteConfigurationError(ApiHttpError):
    """Raised when route metadata is invalid or conflicting."""

    status_code = 500
    error_code = "route_configuration_error"
    default_message = "Route configuration is invalid."


class ResponseHandlingError(ApiHttpError):
    """Raised when a controller returns an unsupported response type."""

    status_code = 500
    error_code = "invalid_controller_response"
    default_message = "Controller must return an HttpResponse-compatible object."


class ValidationError(ApiHttpError):
    """Raised for request validation errors."""

    status_code = 400
    error_code = "validation_error"
    default_message = "Request validation failed."


class UnauthorizedError(ApiHttpError):
    """Raised for authentication failures."""

    status_code = 401
    error_code = "unauthorized"
    default_message = "Authentication is required."


class ForbiddenError(ApiHttpError):
    """Raised when an authenticated actor lacks required permissions."""

    status_code = 403
    error_code = "forbidden"
    default_message = "You do not have permission to access this resource."


class NotFoundError(ApiHttpError):
    """Raised when a requested entity does not exist."""

    status_code = 404
    error_code = "not_found"
    default_message = "The requested resource was not found."


class ConflictError(ApiHttpError):
    """Raised for domain conflict scenarios."""

    status_code = 409
    error_code = "conflict"
    default_message = "Request conflicts with current state."


class InternalServerError(ApiHttpError):
    """Raised for unexpected server-side failures."""

    status_code = 500
    error_code = "internal_server_error"
    default_message = "An internal server error occurred."
