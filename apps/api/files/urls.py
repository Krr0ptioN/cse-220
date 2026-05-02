"""File application URL configuration."""

from django.urls import path
from files.views import FileServingView

app_name = "files"

urlpatterns = [
    path("<uuid:file_id>/", FileServingView.as_view(), name="serve-file"),
]
