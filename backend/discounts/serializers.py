from rest_framework import serializers
from .models import DiscountCode


class DiscountCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCode
        fields = [
            'id', 'code', 'discount_type', 'discount_value',
            'valid_from', 'valid_until', 'is_active',
            'max_uses', 'times_used', 'created_at',
        ]
        read_only_fields = ['times_used', 'created_at']

    def validate_code(self, value):
        return value.upper().strip()

    def validate_discount_value(self, value):
        if value <= 0:
            raise serializers.ValidationError('Discount value must be greater than zero.')
        return value

    def validate(self, data):
        if data.get('discount_type') == 'percentage' and data.get('discount_value', 0) > 100:
            raise serializers.ValidationError({'discount_value': 'Percentage cannot exceed 100.'})
        return data
