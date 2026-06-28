from django.db import models


class TenantPaymentProvider(models.Model):
    tenant = models.OneToOneField(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='payment_provider'
    )
    stripe_account_id = models.CharField(max_length=100, blank=True, default='')
    stripe_onboarding_complete = models.BooleanField(default=False)
    connected_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"PaymentProvider({self.tenant.slug})"
