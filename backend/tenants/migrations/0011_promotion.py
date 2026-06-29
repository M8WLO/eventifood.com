from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0010_tenant_july_giveaway'),
    ]

    operations = [
        migrations.CreateModel(
            name='Promotion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('banner_headline', models.CharField(max_length=200)),
                ('banner_subtext', models.CharField(max_length=400)),
                ('banner_cta', models.CharField(default='Claim free months →', max_length=80)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('trial_until', models.DateField()),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-start_date'],
            },
        ),
    ]
