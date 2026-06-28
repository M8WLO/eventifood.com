from rest_framework import serializers
from django.db.models import Sum, F
from .models import Event, EventPreset


class EventPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventPreset
        fields = ['id', 'name', 'pitch_cost', 'pitch_percent', 'staff_entries', 'item_overrides', 'created_at']
        read_only_fields = ['id', 'created_at']


class EventSerializer(serializers.ModelSerializer):
    total_staffing_cost = serializers.SerializerMethodField()
    pl_summary = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'name', 'date', 'pitch_cost', 'pitch_percent', 'staff_entries',
            'item_overrides', 'is_active', 'created_at',
            'total_staffing_cost', 'pl_summary',
        ]
        read_only_fields = ['id', 'created_at', 'total_staffing_cost', 'pl_summary']

    def get_total_staffing_cost(self, obj):
        return round(sum(
            float(e.get('hours', 0)) * float(e.get('hourly_rate', 0))
            for e in (obj.staff_entries or [])
        ), 2)

    def get_pl_summary(self, obj):
        from orders.models import Order, OrderItem

        orders = Order.objects.filter(tenant=obj.tenant, created_at__date=obj.date)
        revenue = float(orders.aggregate(t=Sum('total'))['t'] or 0)

        cogs = float(
            OrderItem.objects.filter(order__in=orders, cost_price__isnull=False)
            .aggregate(t=Sum(F('cost_price') * F('quantity')))['t'] or 0
        )

        staffing_cost = round(sum(
            float(e.get('hours', 0)) * float(e.get('hourly_rate', 0))
            for e in (obj.staff_entries or [])
        ), 2)
        pitch = float(obj.pitch_cost or 0)
        pitch_percent_cost = round(revenue * float(obj.pitch_percent or 0) / 100, 2)

        gross_profit = revenue - cogs
        net_profit = gross_profit - pitch - pitch_percent_cost - staffing_cost

        return {
            'order_count': orders.count(),
            'revenue': round(revenue, 2),
            'cogs': round(cogs, 2),
            'gross_profit': round(gross_profit, 2),
            'pitch_cost': round(pitch, 2),
            'pitch_percent': float(obj.pitch_percent or 0),
            'pitch_percent_cost': pitch_percent_cost,
            'staffing_cost': round(staffing_cost, 2),
            'net_profit': round(net_profit, 2),
        }
