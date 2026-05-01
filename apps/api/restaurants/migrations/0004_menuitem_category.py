# Generated manually for issue #4.

import django.db.models.deletion
from django.db import migrations, models


def copy_restaurant_category_to_menu_items(apps, schema_editor):
    MenuItem = apps.get_model("restaurants", "MenuItem")
    for menu_item in MenuItem.objects.filter(category__isnull=True).select_related("restaurant"):
        menu_item.category_id = menu_item.restaurant.category_id
        menu_item.save(update_fields=["category"])


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0003_remove_category_icon_url_category_icon_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="menuitem",
            name="category",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="menu_items",
                to="restaurants.category",
            ),
        ),
        migrations.RunPython(
            copy_restaurant_category_to_menu_items,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="menuitem",
            name="category",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="menu_items",
                to="restaurants.category",
            ),
        ),
    ]
