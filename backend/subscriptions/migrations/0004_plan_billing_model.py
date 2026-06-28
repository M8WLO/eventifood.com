from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0003_plan_feature_flags_plan_platform_fee_percent_tenantplan'),
    ]

    operations = [
        migrations.AddField(
            model_name='plan',
            name='billing_model',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('payg', 'PAYG — % per transaction (Stripe Connect)'),
                    ('subscription', 'Subscription — monthly/annual recurring fee'),
                ],
                default='payg',
            ),
        ),
        migrations.AddField(
            model_name='plan',
            name='allowed_payment_methods',
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name='plan',
            name='stripe_price_id_monthly',
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name='plan',
            name='stripe_price_id_annual',
            field=models.CharField(max_length=100, blank=True),
        ),
    ]
