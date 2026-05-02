from functools import wraps
from inspect import getmembers, isfunction
from typing import Callable, Iterable

from api_http.route import RouteDefinition

from .constants import _PREFIX_ATTR, _HOOKS_ATTR, _ROUTES_ATTR

from django.http import HttpResponse, JsonResponse
from django.urls import path

from .errors import MethodNotAllowedError, map_exception_to_response


def _build_view(
    controller_class, method_name: str, http_method: str, hooks: list[Callable]
):
    def raw_view(request, *args, **kwargs):
        if request.method != http_method:
            raise MethodNotAllowedError(
                f"Method {request.method} is not allowed. Use {http_method}."
            )

        controller_instance = controller_class(request)
        handler = getattr(controller_instance, method_name)
        result = handler(*args, **kwargs)
        if isinstance(result, HttpResponse):
            return result
        if isinstance(result, dict):
            return JsonResponse(result)
        return HttpResponse(result)

    @wraps(raw_view)
    def wrapped(request, *args, **kwargs):
        try:
            return raw_view(request, *args, **kwargs)
        except Exception as exc:  # noqa: BLE001 - intentional API boundary mapping
            return map_exception_to_response(exc)

    view = wrapped
    for hook in hooks:
        view = hook(view)
    return view


def _join_path(prefix: str, route_path: str) -> str:
    prefix_clean = prefix.strip("/")
    route_clean = route_path.lstrip("/")

    if not prefix_clean and not route_clean:
        return ""

    full_path = "/".join(part for part in [prefix_clean, route_clean] if part)

    if route_path.endswith("/") and not full_path.endswith("/"):
        full_path += "/"
    elif (
        route_path == ""
        and prefix
        and prefix.endswith("/")
        and not full_path.endswith("/")
    ):
        full_path += "/"

    return full_path


def build_urlpatterns(*controller_classes) -> list:
    """Convert controller classes into Django urlpatterns."""

    urlpatterns = []
    for controller_class in controller_classes:
        prefix = getattr(controller_class, _PREFIX_ATTR, "")
        class_hooks = list(getattr(controller_class, _HOOKS_ATTR, []))

        for method_name, method_obj in getmembers(
            controller_class, predicate=isfunction
        ):
            routes: Iterable[RouteDefinition] = getattr(
                method_obj,
                _ROUTES_ATTR, []
            )
            method_hooks = list(getattr(method_obj, _HOOKS_ATTR, []))
            for definition in routes:
                pattern = _join_path(prefix, definition.route_path)
                view = _build_view(
                    controller_class,
                    method_name,
                    definition.method,
                    [*class_hooks, *method_hooks],
                )
                controller_name = controller_class.__name__.lower()
                def_method = definition.method.lower()

                route_name = f"{controller_name}-{method_name}-{def_method}"

                urlpatterns.append(path(pattern, view, name=route_name))

    return urlpatterns
