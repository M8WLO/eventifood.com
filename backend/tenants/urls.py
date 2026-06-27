from django.urls import path
from .views import TenantRegistrationView, TenantDetailView, TenantPublicView

urlpatterns = [
    path('register/', TenantRegistrationView.as_view(), name='tenant-register'),
    path('me/', TenantDetailView.as_view(), name='tenant-detail'),
    path('public/', TenantPublicView.as_view(), name='tenant-public'),
]
