from django.db import models


class DiscountCode(models.Model):
    DISCOUNT_TYPES = [
        ('percentage', 'Percentage off'),
        ('fixed', 'Fixed amount off (£)'),
    ]
    tenant = models.ForeignKey(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='discount_codes'
    )
    code = models.CharField(max_length=50)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default='percentage')
    discount_value = models.DecimalField(max_digits=8, decimal_places=2)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    max_uses = models.IntegerField(null=True, blank=True)
    times_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [('tenant', 'code')]

    def __str__(self):
        return f"{self.code} ({self.tenant.slug})"

    def is_valid(self):
        from django.utils import timezone
        if not self.is_active:
            return False
        today = timezone.now().date()
        if self.valid_from and today < self.valid_from:
            return False
        if self.valid_until and today > self.valid_until:
            return False
        if self.max_uses is not None and self.times_used >= self.max_uses:
            return False
        return True
