from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0008_platform_feature_override'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscription',
            name='gocardless_mandate_id',
            field=models.CharField(blank=True, max_length=100, default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='subscription',
            name='gocardless_subscription_id',
            field=models.CharField(blank=True, max_length=100, default=''),
            preserve_default=False,
        ),
    ]
