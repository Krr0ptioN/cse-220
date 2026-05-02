"""URL pattern assembly and request execution for api_http controllers."""

from __future__ import annotations

from functools import wraps
from typing import Any, Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse, HttpResponseNotAllowed
from django.urls import path

from .constants import CONTROLLER_PREFIX_ATTR, ROUTE_ATTR
from .errors import (
    ApiHttpError,
    InternalServerError,
    ResponseHandlingError,
    RouteConfigurationError,
)
from .route_definition import RouteDefinition
from .utils import join_paths


def build_urlpatterns(controller_cls: type[Any]) -> list[Any]:
    """Build Django urlpatterns from a decorated controller class."""

    prefix = getattr(controller_cls, CONTROLLER_PREFIX_ATTR, "")
    routes_by_path: dict[
        str, dict[str, tuple[Callable[..., Any], RouteDefinition]]
    ] = {}

    for value in controller_cls.__dict__.values():
        route = getattr(value, ROUTE_ATTR, None)
        if route is None:
            continue

        route_path = join_paths(prefix, route.route)
        method = route.method.upper()

        path_routes = routes_by_path.setdefault(route_path, {})
        if method in path_routes:
            raise RouteConfigurationError(
                message=(
                    f"Duplicate route for {controller_cls.__name__} at "
                    f"'{route_path}' with method {method}."
                )
            )

        path_routes[method] = (value, route)

    urlpatterns: list[Any] = []
    for route_path, handlers in routes_by_path.items():
        view = _build_path_view(controller_cls, handlers)
        urlpatterns.append(path(route_path, view))

    return urlpatterns


def _build_path_view(
    controller_cls: type[Any],
    handlers: dict[str, tuple[Callable[..., Any], RouteDefinition]],
) -> Callable[..., HttpResponse]:
    method_views: dict[str, Callable[..., HttpResponse]] = {}
    allowed_methods: set[str] = set()

    for method, (route_func, route) in handlers.items():
        method_view = _build_method_view(controller_cls, route_func, route)

        decorated_view = method_view
        for decorator in reversed(route.decorators):
            decorated_view = decorator(decorated_view)

        method_views[method] = decorated_view
        allowed_methods.add(method)

    if "GET" in method_views:
        allowed_methods.add("HEAD")

    @wraps(next(iter(handlers.values()))[0])
    def view(request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        method = request.method.upper()
        if method == "HEAD" and "GET" in method_views:
            method = "GET"

        handler = method_views.get(method)
        if handler is None:
            return HttpResponseNotAllowed(sorted(allowed_methods))

        return handler(request, *args, **kwargs)

    return view


def _build_method_view(
    controller_cls: type[Any],
    route_func: Callable[..., Any],
    route: RouteDefinition,
) -> Callable[..., HttpResponse]:
    @wraps(route_func)
    def view(request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        try:
            handler = route_func.__get__(controller_cls(request), controller_cls)
            response = handler(*args, **kwargs)
            return _ensure_http_response(response, controller_cls, route_func)
        except ApiHttpError as error:
            return error.to_response()
        except Exception as error:
            details = None
            if settings.DEBUG:
                details = {
                    "type": error.__class__.__name__,
                    "message": str(error),
                }
            return InternalServerError(details=details).to_response()

    return view


def _ensure_http_response(
    response: Any,
    controller_cls: type[Any],
    route_func: Callable[..., Any],
) -> HttpResponse:
    if isinstance(response, HttpResponse):
        return response

    raise ResponseHandlingError(
        message=(
            f"{controller_cls.__name__}.{route_func.__name__} must return "
            "an HttpResponse-compatible object."
        ),
        details={"returned_type": type(response).__name__},
    )
