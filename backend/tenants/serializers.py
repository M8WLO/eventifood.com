from rest_framework import serializers
from .models import Tenant
from accounts.models import TenantMembership


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'slug', 'name', 'banner', 'theme', 'is_active', 'created_at',
                  'qr_code_svg', 'kitchen_nav_items', 'order_number_mode', 'payment_mode',
                  'wait_time_enabled', 'is_demo', 'trial_expires_at']
        read_only_fields = ['id', 'created_at', 'qr_code_svg']


class TenantPublicSerializer(serializers.ModelSerializer):
    """Minimal serializer for buyer-facing API."""
    estimated_wait_minutes = serializers.SerializerMethodField()
    active_event = serializers.SerializerMethodField()
    trial_expired = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = ['name', 'banner', 'theme', 'wait_time_enabled', 'estimated_wait_minutes', 'active_event', 'is_demo', 'trial_expired']

    def get_trial_expired(self, obj):
        return not obj.is_service_live()

    def get_active_event(self, obj):
        from events.models import Event
        event = Event.objects.filter(tenant=obj, is_active=True).first()
        if not event:
            return None
        return {
            'id': event.id,
            'name': event.name,
            'item_overrides': event.item_overrides,
        }

    def get_estimated_wait_minutes(self, obj):
        if not obj.wait_time_enabled:
            return None
        from orders.models import Order
        orders = list(
            Order.objects.filter(tenant=obj, ready_at__isnull=False)
            .order_by('-ready_at')[:5]
        )
        if not orders:
            return None
        total_seconds = sum((o.ready_at - o.created_at).total_seconds() for o in orders)
        return max(1, round(total_seconds / len(orders) / 60))
