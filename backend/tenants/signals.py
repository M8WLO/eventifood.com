from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Tenant


@receiver(post_save, sender=Tenant)
def generate_qr_on_create(sender, instance, created, **kwargs):
    if created and not instance.qr_code_svg:
        instance.generate_qr_code()
        # Use update to avoid triggering signal again
        Tenant.objects.filter(pk=instance.pk).update(qr_code_svg=instance.qr_code_svg)
