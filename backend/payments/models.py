from django.db import models


class TenantPaymentProvider(models.Model):
    tenant = models.OneToOneField(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='payment_provider'
    )
    # Stripe Connect (platform)
    stripe_account_id = models.CharField(max_length=100, blank=True, default='')
    stripe_onboarding_complete = models.BooleanField(default=False)
    connected_at = models.DateTimeField(null=True, blank=True)
    # PayPal Commerce Platform (seller's own PayPal Business account)
    paypal_merchant_id = models.CharField(max_length=200, blank=True, default='')
    paypal_onboarding_complete = models.BooleanField(default=False)
    # SumUp (seller's own SumUp account — API key for online payments)
    sumup_api_key = models.CharField(max_length=500, blank=True, default='')
    sumup_merchant_code = models.CharField(max_length=100, blank=True, default='')
    sumup_enabled = models.BooleanField(default=False)
    # GoCardless Direct Debit (seller's own GoCardless account)
    gocardless_access_token = models.CharField(max_length=500, blank=True, default='')
    gocardless_enabled = models.BooleanField(default=False)

    def __str__(self):
        return f"PaymentProvider({self.tenant.slug})"
