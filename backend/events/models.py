from django.db import models


class Event(models.Model):
    """
    A named trading day/event with optional item overrides and cost tracking.
    When is_active=True, the storefront shows only item_overrides at event prices.
    """
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='events')
    name = models.CharField(max_length=200)
    date = models.DateField()
    pitch_cost = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    pitch_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    # [{name: str, hours: float, hourly_rate: float}]
    staff_entries = models.JSONField(default=list)
    # [{type: 'product'|'variation', id: int, price_override: float|null}]
    item_overrides = models.JSONField(default=list)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.tenant.slug} / {self.name} ({self.date})"


class EventPreset(models.Model):
    """Reusable event template — save item overrides + costs for quick reuse."""
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='event_presets')
    name = models.CharField(max_length=100)
    pitch_cost = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    pitch_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    staff_entries = models.JSONField(default=list)
    item_overrides = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.tenant.slug} / preset: {self.name}"
