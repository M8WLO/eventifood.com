from rest_framework import serializers
from django.utils import timezone
from .models import Subscription, Plan, TenantPlan


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'slug', 'billing_model',
            'platform_fee_percent',
            'monthly_price', 'annual_price',
            'allowed_payment_methods',
            'stripe_product_id', 'stripe_price_id_monthly', 'stripe_price_id_annual',
            'paypal_plan_id_monthly', 'paypal_plan_id_annual',
            'description', 'features', 'feature_flags',
            'max_products', 'max_categories', 'max_staff',
            'is_active', 'is_highlighted', 'display_order', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'stripe_product_id', 'stripe_price_id_monthly', 'stripe_price_id_annual']


class TenantPlanSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.filter(is_active=True),
        source='plan',
        write_only=True,
        required=False,
        allow_null=True,
    )
    can_change = serializers.SerializerMethodField()
    days_until_change = serializers.SerializerMethodField()
    subscription_next_billing_date = serializers.SerializerMethodField()
    subscription_billing_cycle = serializers.SerializerMethodField()

    class Meta:
        model = TenantPlan
        fields = [
            'id', 'plan', 'plan_id', 'activated_at', 'next_change_allowed_at',
            'can_change', 'days_until_change',
            'subscription_next_billing_date', 'subscription_billing_cycle',
        ]
        read_only_fields = [
            'id', 'activated_at', 'next_change_allowed_at', 'can_change', 'days_until_change',
            'subscription_next_billing_date', 'subscription_billing_cycle',
        ]

    def get_can_change(self, obj):
        request = self.context.get('request')
        return obj.can_change(request.user if request else None)

    def get_days_until_change(self, obj):
        if not obj.next_change_allowed_at:
            return 0
        delta = obj.next_change_allowed_at - timezone.now()
        return max(0, delta.days)

    def get_subscription_next_billing_date(self, obj):
        try:
            sub = obj.tenant.subscription
            return str(sub.next_billing_date) if sub.next_billing_date else None
        except Exception:
            return None

    def get_subscription_billing_cycle(self, obj):
        try:
            sub = obj.tenant.subscription
            return sub.plan  # 'monthly' or 'annual'
        except Exception:
            return None


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_tier = PlanSerializer(read_only=True)
    plan_tier_id = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.all(), source='plan_tier', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'plan_tier', 'plan_tier_id', 'status',
            'annual_cost', 'started_at', 'next_billing_date', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AdminSubscriptionSerializer(serializers.ModelSerializer):
    plan_tier = PlanSerializer(read_only=True)
    plan_tier_id = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.all(), source='plan_tier', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'plan_tier', 'plan_tier_id', 'status',
            'annual_cost', 'started_at', 'next_billing_date', 'created_at',
            'stripe_customer_id', 'stripe_subscription_id',
            'paypal_subscription_id', 'payment_provider',
        ]
        read_only_fields = ['id', 'created_at']
