from rest_framework import serializers
from .models import Category, Product, ProductVariation


class ProductVariationPublicSerializer(serializers.ModelSerializer):
    """Excludes cost_price for buyer-facing endpoints."""
    class Meta:
        model = ProductVariation
        fields = ['id', 'name', 'retail_price', 'photo', 'is_available']


class ProductVariationSellerSerializer(serializers.ModelSerializer):
    """Includes cost_price for seller endpoints."""
    class Meta:
        model = ProductVariation
        fields = ['id', 'name', 'cost_price', 'retail_price', 'photo', 'is_available']


class ProductPublicSerializer(serializers.ModelSerializer):
    variations = ProductVariationPublicSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'photo', 'is_visible', 'out_of_stock', 'display_order', 'variations']


class ProductSellerSerializer(serializers.ModelSerializer):
    variations = ProductVariationSellerSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'category', 'name', 'description', 'photo', 'is_visible', 'out_of_stock', 'display_order', 'variations']


class CategorySerializer(serializers.ModelSerializer):
    products = ProductPublicSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'display_order', 'products']


class CategorySellerSerializer(serializers.ModelSerializer):
    products = ProductSellerSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'display_order', 'products']
