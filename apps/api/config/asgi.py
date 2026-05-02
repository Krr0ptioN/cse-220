"""
ASGI config for FlavorMap API.
"""

import os

from django.core.asgi import get_asgi_application

from .bootstrap import configure_workspace_paths

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
configure_workspace_paths()

application = get_asgi_application()
