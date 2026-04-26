"""Shared type aliases for api_http internals."""

from typing import Callable

from django.http import HttpResponse

RouteDecorator = Callable[[Callable[..., HttpResponse]], Callable[..., HttpResponse]]
