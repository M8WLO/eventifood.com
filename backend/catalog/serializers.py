from rest_framework import serializers
from .models import Category, Product, ProductExtra, ProductVariation, GlobalExtra, PrintMenu


class ProductExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductExtra
        fields = ['id', 'name', 'additional_price', 'is_available']


class ProductVariationPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariation
        fields = ['id', 'name', 'retail_price', 'photo', 'is_available', 'qr_code_svg']


class ProductVariationSellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariation
        fields = ['id', 'name', 'cost_price', 'retail_price', 'photo', 'is_available', 'qr_code_svg']


class ProductPublicSerializer(serializers.ModelSerializer):
    variations = ProductVariationPublicSerializer(many=True, read_only=True)
    extras = ProductExtraSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'photo', 'base_price', 'is_visible',
                  'out_of_stock', 'display_order', 'has_variations', 'prep_time_minutes',
                  'variations', 'extras', 'qr_code_svg']


class ProductSellerSerializer(serializers.ModelSerializer):
    variations = ProductVariationSellerSerializer(many=True, read_only=True)
    extras = ProductExtraSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'category', 'name', 'description', 'photo', 'base_price',
                  'has_variations', 'is_visible', 'out_of_stock', 'display_order',
                  'prep_time_minutes', 'variations', 'extras', 'qr_code_svg']


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


class GlobalExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalExtra
        fields = ['id', 'name', 'description', 'price', 'photo', 'is_available',
                  'display_order', 'qr_code_svg']


class PrintMenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrintMenu
        fields = ['id', 'name', 'size', 'items', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
