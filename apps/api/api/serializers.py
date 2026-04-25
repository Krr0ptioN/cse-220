"""Shared serializer helpers for the API."""

from __future__ import annotations

from rest_framework import serializers


class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """ModelSerializer that can include or omit fields at runtime."""

    def __init__(self, *args, include: list[str] | None = None, omit: list[str] | None = None, **kwargs):
        super().__init__(*args, **kwargs)

        if include is not None:
            allowed = {field for field in include if field in self.fields}
            for field_name in list(self.fields):
                if field_name not in allowed:
                    self.fields.pop(field_name)

        if omit:
            for field_name in omit:
                self.fields.pop(field_name, None)
