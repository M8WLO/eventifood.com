from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0009_subscription_gocardless_fields'),
        ('tenants', '0013_update_july_promotion_start_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='promotion',
            name='plan',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='promotions',
                to='subscriptions.plan',
            ),
        ),
    ]
