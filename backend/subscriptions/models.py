from django.db import models
from django.utils import timezone
import datetime


class Plan(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    monthly_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    annual_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    platform_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=2.00)
    description = models.CharField(max_length=255, blank=True)
    # Human-readable feature strings shown on the pricing page
    features = models.JSONField(default=list)
    # Internal feature keys used for gating: e.g. ["inventory","wastage","events","print_menus","analytics","wait_time"]
    feature_flags = models.JSONField(default=list)
    max_products = models.IntegerField(null=True, blank=True)
    max_categories = models.IntegerField(null=True, blank=True)
    max_staff = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_highlighted = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'monthly_price']

    def __str__(self):
        return self.name


class TenantPlan(models.Model):
    tenant = models.OneToOneField('tenants.Tenant', on_delete=models.CASCADE, related_name='tenant_plan')
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='tenant_plans')
    activated_at = models.DateTimeField(default=timezone.now)
    # Null means no lock (e.g. newly set or admin override)
    next_change_allowed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.tenant.slug} → {self.plan.name if self.plan else 'None'}"

    def can_change(self, user=None):
        """Return True if this tenant is allowed to change plan right now."""
        if user and (user.is_staff or getattr(user, 'is_superadmin', False)):
            return True
        if not self.next_change_allowed_at:
            return True
        return timezone.now() >= self.next_change_allowed_at

    def set_plan(self, plan, user=None):
        self.plan = plan
        self.activated_at = timezone.now()
        if user and (user.is_staff or getattr(user, 'is_superadmin', False)):
            self.next_change_allowed_at = None
        else:
            self.next_change_allowed_at = timezone.now() + datetime.timedelta(days=30)
        self.save()


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
    plan_tier = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='subscriptions')
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
