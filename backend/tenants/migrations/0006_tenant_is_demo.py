from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0005_tenant_wait_time_enabled'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='is_demo',
            field=models.BooleanField(default=False),
        ),
    ]
