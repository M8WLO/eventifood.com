from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0004_qr_codes_global_extra_print_menu'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='prep_time_minutes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
