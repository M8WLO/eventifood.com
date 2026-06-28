from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0004_tenant_payment_mode'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='wait_time_enabled',
            field=models.BooleanField(default=False),
        ),
    ]
