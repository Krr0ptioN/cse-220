import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("files", "0001_initial"),
        ("restaurants", "0008_restaurant_favorite_metrics"),
    ]

    operations = [
        migrations.CreateModel(
            name="RestaurantPhoto",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("caption", models.CharField(blank=True, max_length=255)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "file",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="restaurant_gallery_photos",
                        to="files.storedfile",
                    ),
                ),
                (
                    "restaurant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="photos",
                        to="restaurants.restaurant",
                    ),
                ),
            ],
            options={
                "ordering": ["sort_order", "created_at"],
            },
        ),
    ]
