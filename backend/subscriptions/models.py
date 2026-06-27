from django.db import models


class Subscription(models.Model):
    PLANS = [
        ('monthly_split', 'Monthly (6-month split)'),
        ('annual', 'Annual'),
    ]
    STATUS = [
        ('trialing', 'Trialing'),
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('past_due', 'Past Due'),
    ]
    tenant = models.OneToOneField('tenants.Tenant', on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=20, choices=PLANS, default='annual')
    status = models.CharField(max_length=20, choices=STATUS, default='trialing')
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    annual_cost = models.DecimalField(max_digits=8, decimal_places=2, default=300.00)
    started_at = models.DateTimeField(null=True, blank=True)
    next_billing_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tenant.slug} — {self.plan} ({self.status})"
