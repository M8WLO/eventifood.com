from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0014_promotion_plan'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='catalogue_updated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
