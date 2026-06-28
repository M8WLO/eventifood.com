from django.urls import path
from .views import (
    PlaceOrderView, OrderStatusView, SellerOrderListView, UpdateOrderStatusView,
    SalesReportView, PlatformStatsView, ResequenceDailyNumbersView, ResequenceAllTenantsView,
)

urlpatterns = [
    path('place/', PlaceOrderView.as_view(), name='order-place'),
    path('status/<str:order_number>/', OrderStatusView.as_view(), name='order-status'),
    path('seller/', SellerOrderListView.as_view(), name='seller-orders'),
    path('seller/<int:pk>/status/', UpdateOrderStatusView.as_view(), name='order-update-status'),
    path('seller/report/', SalesReportView.as_view(), name='sales-report'),
    path('platform/stats/', PlatformStatsView.as_view(), name='platform-stats'),
    path('admin/resequence-all/', ResequenceAllTenantsView.as_view(), name='order-resequence-all'),
    path('admin/<str:slug>/resequence/', ResequenceDailyNumbersView.as_view(), name='order-resequence'),
]
