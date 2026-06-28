from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0006_order_stripe_session_pending_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='discount_code',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='order',
            name='discount_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
    ]
