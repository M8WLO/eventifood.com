from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('tenants', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DiscountCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50)),
                ('discount_type', models.CharField(choices=[('percentage', 'Percentage off'), ('fixed', 'Fixed amount off (£)')], default='percentage', max_length=20)),
                ('discount_value', models.DecimalField(decimal_places=2, max_digits=8)),
                ('valid_from', models.DateField(blank=True, null=True)),
                ('valid_until', models.DateField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('max_uses', models.IntegerField(blank=True, null=True)),
                ('times_used', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='discount_codes', to='tenants.tenant')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='discountcode',
            unique_together={('tenant', 'code')},
        ),
    ]
