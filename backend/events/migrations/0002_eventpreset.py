from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),
        ('tenants', '0006_tenant_is_demo'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventPreset',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('pitch_cost', models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ('staff_entries', models.JSONField(default=list)),
                ('item_overrides', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='event_presets', to='tenants.tenant')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
    ]
