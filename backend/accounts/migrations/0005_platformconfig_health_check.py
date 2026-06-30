from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_platformconfig_sandbox_mode'),
    ]

    operations = [
        migrations.AddField(
            model_name='platformconfig',
            name='health_check_emails',
            field=models.TextField(
                blank=True,
                default='filemakers@gmail.com',
                help_text='Comma-separated list of addresses to receive hourly health reports.',
            ),
        ),
        migrations.AddField(
            model_name='platformconfig',
            name='health_check_subject',
            field=models.CharField(
                blank=True,
                default='Eventifood Health Report',
                help_text='Subject prefix used in health report emails.',
                max_length=200,
            ),
        ),
    ]
