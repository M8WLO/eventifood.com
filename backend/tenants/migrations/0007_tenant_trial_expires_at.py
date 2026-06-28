from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0006_tenant_is_demo'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='trial_expires_at',
            field=models.DateField(blank=True, null=True),
        ),
    ]
