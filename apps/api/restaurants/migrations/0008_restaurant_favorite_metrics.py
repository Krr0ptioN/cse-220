from django.db import migrations, models
from django.db.models import Count, Max


def backfill_favorite_metrics(apps, schema_editor):
    Restaurant = apps.get_model("restaurants", "Restaurant")
    Favorite = apps.get_model("restaurants", "Favorite")

    favorite_stats = (
        Favorite.objects.values("restaurant_id")
        .annotate(total=Count("id"), last_favorited_at=Max("created_at"))
    )
    for stat in favorite_stats:
        Restaurant.objects.filter(id=stat["restaurant_id"]).update(
            favorite_count=stat["total"],
            favorite_score=stat["total"],
            last_favorited_at=stat["last_favorited_at"],
        )


class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0007_alter_restaurant_primary_photo"),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurant",
            name="favorite_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="restaurant",
            name="favorite_score",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="restaurant",
            name="last_favorited_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(backfill_favorite_metrics, migrations.RunPython.noop),
    ]
