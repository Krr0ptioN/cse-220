"""Decorator to attach hooks to controller classes or methods."""

from __future__ import annotations
from typing import Callable
from .constants import _HOOKS_ATTR


def use(*hooks: Callable):
    """Attach decorator hooks to a controller class or method."""

    def decorator(target):
        existing_hooks = list(getattr(target, _HOOKS_ATTR, []))
        existing_hooks.extend(hooks)
        setattr(target, _HOOKS_ATTR, existing_hooks)
        return target

    return decorator
