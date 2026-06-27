from django.contrib import admin
from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'plan', 'status', 'annual_cost', 'next_billing_date', 'created_at']
    list_filter = ['status', 'plan']
    search_fields = ['tenant__name', 'tenant__slug', 'stripe_customer_id']
    raw_id_fields = ['tenant']
