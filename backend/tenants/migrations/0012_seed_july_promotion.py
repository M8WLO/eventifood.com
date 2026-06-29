from django.db import migrations
import datetime


def seed_july_promotion(apps, schema_editor):
    Promotion = apps.get_model('tenants', 'Promotion')
    if not Promotion.objects.filter(name='July 2026 Giveaway').exists():
        Promotion.objects.create(
            name='July 2026 Giveaway',
            banner_headline='July Giveaway — 3 months completely free.',
            banner_subtext='Register in July, trade free until 1st October. No card. No catch. Our gift to you.',
            banner_cta='Claim free months →',
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2026, 7, 31),
            trial_until=datetime.date(2026, 10, 1),
            is_active=True,
        )


def unseed_july_promotion(apps, schema_editor):
    Promotion = apps.get_model('tenants', 'Promotion')
    Promotion.objects.filter(name='July 2026 Giveaway').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0011_promotion'),
    ]

    operations = [
        migrations.RunPython(seed_july_promotion, unseed_july_promotion),
    ]
