from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='kitchen_nav_items',
            field=models.JSONField(default=list, blank=True),
        ),
    ]
