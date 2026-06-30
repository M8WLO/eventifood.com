from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0008_order_paypal_order_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='source',
            field=models.CharField(
                choices=[('app', 'App'), ('pos', 'POS')],
                default='app',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='pos_device_number',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
