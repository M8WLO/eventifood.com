from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0015_tenant_catalogue_updated_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='latitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='tenant',
            name='longitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
    ]
