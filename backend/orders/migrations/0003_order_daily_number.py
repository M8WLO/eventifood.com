from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_orderitemextra'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='daily_number',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
