from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0004_order_ready_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='trading_date',
            field=models.DateField(null=True, blank=True),
        ),
        # Unique constraint: (tenant, trading_date, daily_number) prevents duplicates
        # Note: null values are excluded from unique checks in PostgreSQL, so existing
        # orders with trading_date=null are safe until resequenced.
        migrations.AlterUniqueTogether(
            name='order',
            unique_together={('tenant', 'order_number'), ('tenant', 'trading_date', 'daily_number')},
        ),
    ]
