from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenantpaymentprovider',
            name='paypal_merchant_id',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='tenantpaymentprovider',
            name='paypal_onboarding_complete',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='tenantpaymentprovider',
            name='sumup_api_key',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.AddField(
            model_name='tenantpaymentprovider',
            name='sumup_merchant_code',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='tenantpaymentprovider',
            name='sumup_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='tenantpaymentprovider',
            name='gocardless_access_token',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.AddField(
            model_name='tenantpaymentprovider',
            name='gocardless_enabled',
            field=models.BooleanField(default=False),
        ),
    ]
