"""Views for user endpoints."""

from rest_framework.views import APIView

from api.rest import api_data, require_authenticated_user
from users.services import UserService


class UsersController(APIView):
    """Controller for users endpoints."""

    service_class = UserService

    def get_service(self) -> UserService:
        return self.service_class()

    def get(self, request):
        user = require_authenticated_user(request)
        return api_data(self.get_service().me(user))
