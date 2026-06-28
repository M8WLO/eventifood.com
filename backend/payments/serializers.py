from rest_framework import serializers
from .models import TenantPaymentProvider


class PaymentProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantPaymentProvider
        fields = ['stripe_account_id', 'stripe_onboarding_complete', 'connected_at']
        read_only_fields = fields
