"""Shared helpers for DRF-powered API views."""

from __future__ import annotations

from typing import Iterable

from django.core.paginator import Paginator
from rest_framework.response import Response

from api.exceptions import ApiError


def api_data(data, *, status_code: int = 200) -> Response:
    """Return a standard payload wrapper for endpoint responses."""

    return Response({"data": data}, status=status_code)


def api_paginated(data, pagination: dict[str, int]) -> Response:
    """Return a standard paginated response."""

    return Response({"data": data, "pagination": pagination})


def parse_csv_param(value: str | None) -> list[str]:
    """Parse a comma-separated query parameter into normalized field names."""

    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def paginate_queryset(queryset, request, *, default_page_size: int = 20, max_page_size: int = 100):
    """Paginate a queryset using page/page_size query params."""

    page = _parse_positive_int(request.query_params.get("page"), default=1)
    page_size = _parse_positive_int(
        request.query_params.get("page_size"),
        default=default_page_size,
        maximum=max_page_size,
    )

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    pagination = {
        "page": page_obj.number,
        "page_size": page_size,
        "total": paginator.count,
        "total_pages": paginator.num_pages,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
    }
    return page_obj, pagination


def require_authenticated_user(request):
    """Return the authenticated user or raise an auth_required error."""

    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        raise ApiError(
            status_code=401,
            code="auth_required",
            detail="Authentication is required.",
        )
    return user


def require_user_role(user, allowed_roles: Iterable[str], *, message: str) -> None:
    """Ensure the user belongs to one of the permitted roles."""

    if user.role not in set(allowed_roles):
        raise ApiError(status_code=403, code="forbidden", detail=message)


def _parse_positive_int(value: str | None, *, default: int, maximum: int | None = None) -> int:
    try:
        parsed = int(value) if value is not None else default
    except (TypeError, ValueError):
        parsed = default

    if parsed < 1:
        parsed = default
    if maximum is not None:
        parsed = min(parsed, maximum)
    return parsed
