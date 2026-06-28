from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_order_trading_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='stripe_session_id',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending_payment', 'Pending Payment'),
                    ('placed', 'Placed'),
                    ('preparing', 'Preparing'),
                    ('ready', 'Ready'),
                    ('collected', 'Collected'),
                ],
                default='placed',
                max_length=20,
            ),
        ),
    ]
