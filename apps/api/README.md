# FlavorMap API (Django)

Backend API for FlavorMap, built with Django and managed through Nx targets.

## API Architecture (DRF)

This API uses Django REST Framework with an explicit Controller → Service → Repository structure.

- Controller classes inherit from DRF `APIView` and handle HTTP concerns.
- Service classes coordinate business rules and authorization decisions.
- Repository classes isolate ORM queries and persistence.
- Serializers handle request validation and response shaping.

Example:

```python
from rest_framework.views import APIView

from api.rest import api_data, require_authenticated_user
from users.services import UserService


class UsersController(APIView):
    service_class = UserService

    def get(self, request):
        user = require_authenticated_user(request)
        return api_data(self.service_class().me(user))


urlpatterns = [path("me/", UsersController.as_view())]
```

## Why Nx Commands

Use Nx as the single entrypoint for daily API workflows. This keeps commands consistent across the team and makes them easy to discover in `apps/api/project.json`.

## Quick Start

From workspace root:

```bash
./dev-setup.sh

# Windows PowerShell
./dev-setup.ps1

# Manual commands
./nx run api:install
./nx run api:migrate
./nx run api:runserver
```

The server starts on Django's default `http://127.0.0.1:8000/`.

## Command Reference (Nx)

All commands run from workspace root unless noted.

### Django Operations

```bash
./nx run api:runserver
./nx run api:makemigrations
./nx run api:makemigrations-check
./nx run api:migrate
./nx run api:showmigrations
./nx run api:createsuperuser
./nx run api:shell
./nx run api:check
./nx run api:collectstatic
```

### Testing

```bash
./nx run api:test
```

### Poetry/Nx Python Plugin Operations

```bash
./nx run api:install
./nx run api:lock
./nx run api:sync
./nx run api:add
./nx run api:update
./nx run api:remove
./nx run api:build
```

## Generic Manage.py via Nx

You can run any Django management command through the generic target:

```bash
./nx run api:django -- <manage.py args>
```

Examples:

```bash
./nx run api:django -- migrate --plan
./nx run api:django -- createsuperuser --help
./nx run api:django -- loaddata initial_data.json
```

## Typical Daily Flow

```bash
./nx run api:makemigrations
./nx run api:migrate
./nx run api:check
./nx run api:test
./nx run api:runserver
```

## Technical Spec

Reference architecture and endpoint plan:

- `docs/TECHNICAL_SPECIFICATION.md`
