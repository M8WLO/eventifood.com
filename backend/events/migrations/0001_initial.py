from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('tenants', '0005_tenant_wait_time_enabled'),
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('date', models.DateField()),
                ('pitch_cost', models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ('staff_entries', models.JSONField(default=list)),
                ('item_overrides', models.JSONField(default=list)),
                ('is_active', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='events',
                    to='tenants.tenant',
                )),
            ],
            options={
                'ordering': ['-date', '-created_at'],
            },
        ),
    ]
