from django.urls import path
from .views import PlaceOrderView, OrderStatusView, SellerOrderListView, UpdateOrderStatusView, SalesReportView

urlpatterns = [
    path('place/', PlaceOrderView.as_view(), name='order-place'),
    path('status/<str:order_number>/', OrderStatusView.as_view(), name='order-status'),
    path('seller/', SellerOrderListView.as_view(), name='seller-orders'),
    path('seller/<int:pk>/status/', UpdateOrderStatusView.as_view(), name='order-update-status'),
    path('seller/report/', SalesReportView.as_view(), name='sales-report'),
]
