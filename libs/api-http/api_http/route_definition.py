"""Route metadata structures used by decorators and router assembly."""

from dataclasses import dataclass, field

from .types import RouteDecorator


@dataclass(slots=True)
class RouteDefinition:
    """Route configuration attached to controller methods."""

    method: str
    route: str
    decorators: list[RouteDecorator] = field(default_factory=list)
