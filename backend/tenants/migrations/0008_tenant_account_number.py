from django.db import migrations, models


def backfill_account_numbers(apps, schema_editor):
    Tenant = apps.get_model('tenants', 'Tenant')
    for tenant in Tenant.objects.filter(account_number=''):
        tenant.account_number = f'EF-{tenant.id:05d}'
        tenant.save(update_fields=['account_number'])


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0007_tenant_trial_expires_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='account_number',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.RunPython(backfill_account_numbers, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='tenant',
            name='account_number',
            field=models.CharField(blank=True, default='', max_length=20, unique=True),
        ),
    ]
