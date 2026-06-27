from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['variation', 'product_name', 'variation_name', 'retail_price', 'cost_price', 'quantity', 'subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'tenant', 'buyer_name', 'status', 'total', 'created_at']
    list_filter = ['status', 'tenant']
    search_fields = ['order_number', 'buyer_name', 'buyer_email']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_name', 'variation_name', 'quantity', 'retail_price', 'subtotal']
    search_fields = ['product_name', 'variation_name']
