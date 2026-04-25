"""User serializers."""

from rest_framework import serializers

from users.models import User


class UserPublicSerializer(serializers.ModelSerializer):
    """Public-facing user representation."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "display_name",
            "bio",
            "avatar_url",
            "role",
            "created_at",
            "updated_at",
        ]
