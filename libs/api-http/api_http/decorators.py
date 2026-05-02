"""Decorators for declaring controller routes and middleware wrappers."""

from __future__ import annotations

from typing import Any, Callable

from .constants import CONTROLLER_PREFIX_ATTR, PENDING_DECORATORS_ATTR, ROUTE_ATTR
from .errors import RouteConfigurationError
from .route_definition import RouteDefinition
from .types import RouteDecorator


def controller(prefix: str = "") -> Callable[[type[Any]], type[Any]]:
    """Mark a class as a controller and optionally set route prefix."""

    def decorator(cls: type[Any]) -> type[Any]:
        setattr(cls, CONTROLLER_PREFIX_ATTR, prefix)
        return cls

    return decorator


def use(
    *decorators: RouteDecorator,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Attach one or more Django-style decorators to a route handler."""

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        route = getattr(func, ROUTE_ATTR, None)
        if route is None:
            pending = list(getattr(func, PENDING_DECORATORS_ATTR, []))
            pending.extend(decorators)
            setattr(func, PENDING_DECORATORS_ATTR, pending)
            return func

        route.decorators.extend(decorators)
        return func

    return decorator


def get(route: str = "") -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Register a GET handler for a controller method."""

    return _method_decorator("GET", route)


def post(route: str = "") -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Register a POST handler for a controller method."""

    return _method_decorator("POST", route)


def put(route: str = "") -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Register a PUT handler for a controller method."""

    return _method_decorator("PUT", route)


def patch(route: str = "") -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Register a PATCH handler for a controller method."""

    return _method_decorator("PATCH", route)


def delete(route: str = "") -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Register a DELETE handler for a controller method."""

    return _method_decorator("DELETE", route)


def _method_decorator(
    method: str,
    route: str,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        if getattr(func, ROUTE_ATTR, None) is not None:
            raise RouteConfigurationError(
                message=f"Route already configured for {func.__name__}"
            )

        route_definition = RouteDefinition(method=method, route=route)
        pending = list(getattr(func, PENDING_DECORATORS_ATTR, []))
        route_definition.decorators.extend(pending)

        setattr(func, ROUTE_ATTR, route_definition)
        if hasattr(func, PENDING_DECORATORS_ATTR):
            delattr(func, PENDING_DECORATORS_ATTR)

        return func

    return decorator
