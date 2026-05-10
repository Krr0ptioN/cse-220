"""File application views."""

from uuid import UUID

from django.http import HttpResponseRedirect, Http404
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from wireup import Injected
from wireup.integration.django import inject

from files.services import FileService


class FileServingView(APIView):
    """
    Serves or redirects to a file by its database ID, 
    hiding the internal storage path.
    """
    permission_classes = [AllowAny]

    @inject
    def get(self, request, file_id: UUID, service: Injected[FileService], *args, **kwargs):
        url = service.get_url_by_id(file_id)

        if not url:
            raise Http404("File not found")

        # We redirect to the actual storage URL (Local or MinIO)
        return HttpResponseRedirect(url)
