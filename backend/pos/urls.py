from django.urls import path
from .views import PosSyncView, PosOrderView, PosBulkOrderView, PosStatusView, PosLookupTenantView, PosAuthDeviceView, PosTakingsView

urlpatterns = [
    path('sync/', PosSyncView.as_view(), name='pos-sync'),
    path('orders/', PosOrderView.as_view(), name='pos-orders'),
    path('orders/bulk/', PosBulkOrderView.as_view(), name='pos-orders-bulk'),
    path('status/', PosStatusView.as_view(), name='pos-status'),
    path('lookup-tenant/', PosLookupTenantView.as_view(), name='pos-lookup-tenant'),
    path('auth-device/', PosAuthDeviceView.as_view(), name='pos-auth-device'),
    path('takings/', PosTakingsView.as_view(), name='pos-takings'),
]
