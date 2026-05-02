"""
Defines the `route` decorator for registering HTTP routes on
controller methods.
"""

from dataclasses import dataclass

from .constants import _ROUTES_ATTR


@dataclass(frozen=True)
class RouteDefinition:
    """Definition of an HTTP route on a controller method."""
    method: str
    route_path: str


def route(method: str, route_path: str = ""):
    """Register an HTTP route on a controller method."""

    normalized = method.upper()

    def decorator(func):
        routes = list(getattr(func, _ROUTES_ATTR, []))
        routes.append(
            RouteDefinition(
                method=normalized,
                route_path=route_path
            )
        )
        setattr(func, _ROUTES_ATTR, routes)
        return func

    return decorator
