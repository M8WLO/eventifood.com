from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0002_tenant_kitchen_nav_items'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='order_number_mode',
            field=models.CharField(
                choices=[('daily', 'Daily (resets each day)'), ('total', 'Total (cumulative)')],
                default='daily',
                max_length=10,
            ),
        ),
    ]
