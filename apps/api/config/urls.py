"""
URL configuration for FlavorMap API.
"""

from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from restaurants.views import CategoryListController

urlpatterns = [
    path("admin/", admin.site.urls),
    # API Schema and Documentation
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/v1/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/v1/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    path("api/v1/health/", include("api.urls")),
    path("api/v1/auth/", include("users.auth_urls")),
    path("api/v1/users/", include("users.urls")),
    path("api/v1/categories/", CategoryListController.as_view(), name="categories-list"),
    path("api/v1/restaurants/", include("restaurants.urls")),
    path("api/v1/reviews/", include("reviews.urls")),
    path("api/v1/files/", include("files.urls")),
]

# Serve media files in development
if settings.DEBUG:
    if settings.FILE_STORAGE_BACKEND.lower() == "local":
        urlpatterns += static(
            settings.FILE_STORAGE_LOCAL_URL,
            document_root=settings.FILE_STORAGE_LOCAL_ROOT,
        )
    else:
        urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
