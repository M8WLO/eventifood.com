from rest_framework import serializers
from .models import Subscription, Plan


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'slug', 'monthly_price', 'annual_price',
            'description', 'features', 'max_products', 'max_categories',
            'max_staff', 'is_active', 'is_highlighted', 'display_order', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


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
        ]
        read_only_fields = ['id', 'created_at']
