from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0002_add_base_price_has_variations'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductExtra',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('additional_price', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('is_available', models.BooleanField(default=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='extras', to='catalog.product')),
            ],
            options={
                'ordering': ['additional_price', 'name'],
            },
        ),
    ]
