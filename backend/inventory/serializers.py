from rest_framework import serializers
from .models import StockRecord


class StockRecordSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = StockRecord
        fields = ['id', 'product', 'product_name', 'date', 'starting_qty', 'wastage_qty', 'wastage_cost', 'notes']
