from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
        ('catalog', '0003_productextra'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderItemExtra',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('additional_price', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('extra', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='catalog.productextra')),
                ('order_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='extras', to='orders.orderitem')),
            ],
            options={
                'ordering': ['id'],
            },
        ),
    ]
