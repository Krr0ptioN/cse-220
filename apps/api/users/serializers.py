"""User serializers."""

from rest_framework import serializers

from users.models import User, UserRole


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


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Editable fields for the current user's profile."""

    class Meta:
        model = User
        fields = ["username", "display_name", "bio", "avatar_url"]
        extra_kwargs = {
            "username": {"required": False},
            "display_name": {"required": False, "allow_blank": True},
            "bio": {"required": False, "allow_blank": True},
            "avatar_url": {"required": False, "allow_blank": True},
        }


class RegisterSerializer(serializers.ModelSerializer):
    """Public registration serializer for reviewer and owner accounts."""

    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(
        choices=[UserRole.USER, UserRole.OWNER],
        default=UserRole.USER,
        required=False,
    )

    class Meta:
        model = User
        fields = ["email", "username", "password", "display_name", "role"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    """Login payload serializer."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
