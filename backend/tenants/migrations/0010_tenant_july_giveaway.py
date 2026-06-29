from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0009_tenant_show_event_menu_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='july_giveaway',
            field=models.BooleanField(default=False),
        ),
    ]
