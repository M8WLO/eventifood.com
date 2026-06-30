from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('tenants', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='POSDevice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('device_number', models.PositiveIntegerField()),
                ('registered_at', models.DateTimeField(auto_now_add=True)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pos_devices', to='tenants.tenant')),
            ],
            options={
                'ordering': ['device_number'],
                'unique_together': {('tenant', 'device_number')},
            },
        ),
    ]
