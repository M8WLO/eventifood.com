from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Plan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('slug', models.SlugField(unique=True)),
                ('monthly_price', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('annual_price', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('features', models.JSONField(default=list)),
                ('max_products', models.IntegerField(blank=True, null=True)),
                ('max_categories', models.IntegerField(blank=True, null=True)),
                ('max_staff', models.IntegerField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('is_highlighted', models.BooleanField(default=False)),
                ('display_order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['display_order', 'monthly_price'],
            },
        ),
        migrations.AddField(
            model_name='subscription',
            name='plan_tier',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='subscriptions',
                to='subscriptions.plan',
            ),
        ),
    ]
