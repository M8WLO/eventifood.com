from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0007_order_discount_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='paypal_order_id',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
    ]
