from django.contrib import admin
from .models import Category, Product, ProductVariation


class ProductVariationInline(admin.TabularInline):
    model = ProductVariation
    extra = 1


class ProductInline(admin.TabularInline):
    model = Product
    extra = 0
    show_change_link = True


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'display_order']
    list_filter = ['tenant']
    search_fields = ['name', 'tenant__name']
    inlines = [ProductInline]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_visible', 'out_of_stock', 'display_order']
    list_filter = ['is_visible', 'out_of_stock', 'category__tenant']
    search_fields = ['name', 'category__name']
    inlines = [ProductVariationInline]


@admin.register(ProductVariation)
class ProductVariationAdmin(admin.ModelAdmin):
    list_display = ['name', 'product', 'retail_price', 'cost_price', 'is_available']
    list_filter = ['is_available']
    search_fields = ['name', 'product__name']
