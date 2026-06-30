from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone

from .models import Category, Product, ProductVariation, ProductExtra, GlobalExtra


def _touch_tenant(tenant):
    if tenant is None:
        return
    from tenants.models import Tenant
    Tenant.objects.filter(pk=tenant.pk).update(catalogue_updated_at=timezone.now())


@receiver([post_save, post_delete], sender=Category)
def category_changed(sender, instance, **kwargs):
    _touch_tenant(instance.tenant)


@receiver([post_save, post_delete], sender=Product)
def product_changed(sender, instance, **kwargs):
    _touch_tenant(instance.tenant)


@receiver([post_save, post_delete], sender=ProductVariation)
def variation_changed(sender, instance, **kwargs):
    try:
        _touch_tenant(instance.product.category.tenant)
    except Exception:
        pass


@receiver([post_save, post_delete], sender=ProductExtra)
def extra_changed(sender, instance, **kwargs):
    try:
        _touch_tenant(instance.product.category.tenant)
    except Exception:
        pass


@receiver([post_save, post_delete], sender=GlobalExtra)
def global_extra_changed(sender, instance, **kwargs):
    _touch_tenant(instance.tenant)
