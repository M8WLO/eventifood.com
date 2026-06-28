from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0004_plan_billing_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='plan',
            name='paypal_plan_id_monthly',
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name='plan',
            name='paypal_plan_id_annual',
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name='subscription',
            name='paypal_subscription_id',
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name='subscription',
            name='payment_provider',
            field=models.CharField(max_length=20, blank=True),
        ),
    ]
