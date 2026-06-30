from django.db import migrations
import datetime


def update_july_start_date(apps, schema_editor):
    Promotion = apps.get_model('tenants', 'Promotion')
    Promotion.objects.filter(
        name='July 2026 Giveaway',
        start_date=datetime.date(2026, 7, 1),
    ).update(start_date=datetime.date(2026, 6, 29))


def revert_july_start_date(apps, schema_editor):
    Promotion = apps.get_model('tenants', 'Promotion')
    Promotion.objects.filter(
        name='July 2026 Giveaway',
        start_date=datetime.date(2026, 6, 29),
    ).update(start_date=datetime.date(2026, 7, 1))


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0012_seed_july_promotion'),
    ]

    operations = [
        migrations.RunPython(update_july_start_date, revert_july_start_date),
    ]
