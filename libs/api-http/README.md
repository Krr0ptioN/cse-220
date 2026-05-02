# api-http

Internal Python library that adds lightweight controller-style routing utilities for Django.

## What It Provides

- `Controller` base class with JSON response helpers.
- Response classes: `OkResponse`, `CreatedResponse`, `NoContentResponse`, `ErrorResponse`.
- Error classes with automatic JSON formatting: `ApiHttpError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`.
- HTTP decorators: `@get`, `@post`, `@put`, `@patch`, `@delete`.
- `@use(...)` support for Django decorators like `login_required`.
- `build_urlpatterns(...)` to generate Django URL routes from controller classes.

## Internal Structure

- `api_http/controller.py`: base controller methods and response helpers.
- `api_http/responses.py`: reusable response classes.
- `api_http/errors.py`: structured error classes.
- `api_http/decorators.py`: route and middleware decorators.
- `api_http/routing.py`: route assembly and request execution.

## Example

```python
from api_http import Controller, build_urlpatterns, controller, get, use
from django.contrib.auth.decorators import login_required


@controller()
class UsersController(Controller):
    @use(login_required)
    @get("me/")
    def me(self):
        return self.ok({"email": self.request.user.email})


urlpatterns = build_urlpatterns(UsersController)
```

## Nx Commands

Run from repository root:

```bash
./nx run api-http:install
./nx run api-http:test
./nx run api-http:build
```
