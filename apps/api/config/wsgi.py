"""
WSGI config for FlavorMap API.
"""

import os

from django.core.wsgi import get_wsgi_application

from .bootstrap import configure_workspace_paths

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
configure_workspace_paths()

application = get_wsgi_application()
