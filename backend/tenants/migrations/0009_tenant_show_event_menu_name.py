from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0008_tenant_account_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='show_event_menu_name',
            field=models.BooleanField(default=False),
        ),
    ]
