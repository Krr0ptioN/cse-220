"""Application services for cross-cutting API endpoints."""

from datetime import datetime, timezone


class HealthService:
    """Builds health check response data."""

    def __init__(self, *, start_time: datetime) -> None:
        self.start_time = start_time

    def health(self) -> dict[str, object]:
        now = datetime.now(timezone.utc)
        return {
            "status": "ok",
            "version": "1.0.0",
            "service": "flavormap-api",
            "uptime_seconds": int((now - self.start_time).total_seconds()),
        }
