from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0005_product_prep_time'),
    ]

    operations = [
        migrations.AddField(
            model_name='printmenu',
            name='is_default',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='printmenu',
            name='is_web_facing',
            field=models.BooleanField(default=False),
        ),
    ]
