from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_user_email_verified'),
    ]

    operations = [
        migrations.AddField(
            model_name='platformconfig',
            name='sandbox_mode',
            field=models.BooleanField(default=False),
        ),
    ]
