from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order


@receiver(post_save, sender=Order)
def order_status_changed(sender, instance, created, **kwargs):
    """Signal hook — actual notification is triggered in UpdateOrderStatusView."""
    pass
