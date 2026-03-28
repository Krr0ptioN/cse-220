"""Health check endpoint for FlavorMap API."""

from django.http import JsonResponse

def health():
    """Return API health status as JSON."""
    return JsonResponse({
        "status": "ok",
        "version": "1.0.0",
        "service": "flavormap-api",
    })