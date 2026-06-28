from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0003_productextra'),
        ('tenants', '0001_initial'),
    ]

    operations = [
        # QR code fields on existing models
        migrations.AddField(
            model_name='product',
            name='qr_code_svg',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='productvariation',
            name='qr_code_svg',
            field=models.TextField(blank=True),
        ),
        # GlobalExtra model
        migrations.CreateModel(
            name='GlobalExtra',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('price', models.DecimalField(decimal_places=2, max_digits=8)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='extras/')),
                ('is_available', models.BooleanField(default=True)),
                ('qr_code_svg', models.TextField(blank=True)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='global_extras',
                    to='tenants.tenant',
                )),
            ],
            options={'ordering': ['display_order', 'name']},
        ),
        # PrintMenu model
        migrations.CreateModel(
            name='PrintMenu',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('size', models.CharField(
                    choices=[('a4', 'A4'), ('a3', 'A3'), ('a2', 'A2')],
                    default='a4',
                    max_length=4,
                )),
                ('items', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='print_menus',
                    to='tenants.tenant',
                )),
            ],
            options={'ordering': ['-updated_at']},
        ),
    ]
