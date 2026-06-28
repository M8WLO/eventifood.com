from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0002_eventpreset'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='pitch_percent',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='eventpreset',
            name='pitch_percent',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
    ]
