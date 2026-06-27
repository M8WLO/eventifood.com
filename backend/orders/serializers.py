from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'variation', 'product_name', 'variation_name', 'retail_price', 'cost_price', 'quantity', 'subtotal']
        read_only_fields = ['product_name', 'variation_name', 'retail_price', 'cost_price', 'subtotal']


class PlaceOrderItemSerializer(serializers.Serializer):
    variation_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class PlaceOrderSerializer(serializers.Serializer):
    buyer_name = serializers.CharField(max_length=100)
    buyer_email = serializers.EmailField()
    buyer_phone = serializers.CharField(max_length=20, allow_blank=True, default='')
    notes = serializers.CharField(allow_blank=True, default='')
    items = PlaceOrderItemSerializer(many=True)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'buyer_name', 'buyer_email', 'buyer_phone',
                  'status', 'total', 'notes', 'created_at', 'updated_at', 'items']
        read_only_fields = ['id', 'order_number', 'total', 'created_at', 'updated_at']


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['order_number', 'status', 'buyer_name', 'created_at', 'updated_at']
