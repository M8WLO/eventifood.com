from django.urls import path
from .views import PosSyncView, PosOrderView, PosBulkOrderView, PosStatusView

urlpatterns = [
    path('sync/', PosSyncView.as_view(), name='pos-sync'),
    path('orders/', PosOrderView.as_view(), name='pos-orders'),
    path('orders/bulk/', PosBulkOrderView.as_view(), name='pos-orders-bulk'),
    path('status/', PosStatusView.as_view(), name='pos-status'),
]
