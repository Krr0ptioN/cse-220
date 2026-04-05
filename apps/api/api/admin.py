<<<<<<< Updated upstream
"""Admin registrations for api app."""
=======
"""Admin registrations for api models."""

from django.contrib import admin

from api.models import Resturant


@admin.register(Resturant)
class ResturantAdmin(admin.ModelAdmin):
    """Admin configuration for the Resturant model."""

    list_display = ("id", "name", "is_active", "created_at", "updated_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("name", "description")
    ordering = ("-created_at",)
>>>>>>> Stashed changes
