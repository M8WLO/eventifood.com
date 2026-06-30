from django.db import models


class POSDevice(models.Model):
    """Tracks each registered POS till per tenant. Device number is auto-assigned."""
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='pos_devices')
    device_number = models.PositiveIntegerField()
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('tenant', 'device_number')
        ordering = ['device_number']

    def __str__(self):
        return f"Till {self.device_number} @ {self.tenant.slug}"
