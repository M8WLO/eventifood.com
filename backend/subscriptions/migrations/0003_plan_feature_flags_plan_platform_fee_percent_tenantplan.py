from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0002_plan_subscription_plan_tier'),
        ('tenants', '0005_tenant_wait_time_enabled'),
    ]

    operations = [
        migrations.AddField(
            model_name='plan',
            name='platform_fee_percent',
            field=models.DecimalField(decimal_places=2, default=2.0, max_digits=5),
        ),
        migrations.AddField(
            model_name='plan',
            name='feature_flags',
            field=models.JSONField(default=list),
        ),
        migrations.CreateModel(
            name='TenantPlan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('activated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('next_change_allowed_at', models.DateTimeField(blank=True, null=True)),
                ('tenant', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='tenant_plan',
                    to='tenants.tenant',
                )),
                ('plan', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='tenant_plans',
                    to='subscriptions.plan',
                )),
            ],
        ),
    ]
