from django.urls import path
from .views import TenantRegistrationView, TenantDetailView, TenantPublicView, MyTenantView

urlpatterns = [
    path('register/', TenantRegistrationView.as_view(), name='tenant-register'),
    path('me/', TenantDetailView.as_view(), name='tenant-detail'),
    path('mine/', MyTenantView.as_view(), name='tenant-mine'),
    path('public/', TenantPublicView.as_view(), name='tenant-public'),
]
