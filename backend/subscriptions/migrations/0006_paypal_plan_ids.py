from decimal import Decimal
from django.db import migrations

BASIC_PAYPAL_PLAN_ID = 'P-3WH47994B2517492SNJAP6KI'
PRO_PAYPAL_PLAN_ID = 'P-4PP84280A7004961LNJAQIDA'


def set_paypal_plan_ids(apps, schema_editor):
    Plan = apps.get_model('subscriptions', 'Plan')
    for plan in Plan.objects.all():
        name_lower = plan.name.lower()
        if 'basic' in name_lower:
            plan.paypal_plan_id_monthly = BASIC_PAYPAL_PLAN_ID
            plan.save(update_fields=['paypal_plan_id_monthly'])
        elif 'pro' in name_lower:
            plan.paypal_plan_id_monthly = PRO_PAYPAL_PLAN_ID
            plan.save(update_fields=['paypal_plan_id_monthly'])


def unset_paypal_plan_ids(apps, schema_editor):
    Plan = apps.get_model('subscriptions', 'Plan')
    Plan.objects.filter(paypal_plan_id_monthly__in=[BASIC_PAYPAL_PLAN_ID, PRO_PAYPAL_PLAN_ID]).update(
        paypal_plan_id_monthly=''
    )


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0005_paypal_fields'),
    ]

    operations = [
        migrations.RunPython(set_paypal_plan_ids, unset_paypal_plan_ids),
    ]
