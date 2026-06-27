from django.contrib import admin
from .models import StockRecord


@admin.register(StockRecord)
class StockRecordAdmin(admin.ModelAdmin):
    list_display = ['product', 'date', 'starting_qty', 'wastage_qty', 'wastage_cost']
    list_filter = ['date', 'product__category__tenant']
    search_fields = ['product__name']
    date_hierarchy = 'date'
