from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0006_paypal_plan_ids'),
    ]

    operations = [
        migrations.AddField(
            model_name='plan',
            name='stripe_product_id',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
