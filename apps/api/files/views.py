"""File application views."""

from uuid import UUID
from django.http import HttpResponseRedirect, Http404
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from files.services import create_file_service


class FileServingView(APIView):
    """
    Serves or redirects to a file by its database ID, 
    hiding the internal storage path.
    """
    permission_classes = [AllowAny]

    def get(self, request, file_id: UUID, *args, **kwargs):
        service = create_file_service()
        url = service.get_url_by_id(file_id)
        
        if not url:
            raise Http404("File not found")
            
        # We redirect to the actual storage URL (Local or MinIO)
        return HttpResponseRedirect(url)
