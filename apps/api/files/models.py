"""File application models."""

import uuid
from django.db import models


class StoredFile(models.Model):
    """Database record for a stored file object."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    path = models.CharField(max_length=500, db_index=True)
    category = models.CharField(max_length=100, db_index=True)
    entity_id = models.CharField(max_length=100, db_index=True, blank=True)
    content_type = models.CharField(max_length=100)
    size = models.PositiveIntegerField(null=True, blank=True)
    
    # Optional: store thumbnail data as JSON or separate records
    # For simplicity, we'll store thumbnails in the service/storage logic 
    # and just map the original file ID to the path.
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.id} ({self.path})"
