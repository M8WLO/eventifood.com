from django.urls import path
from .views import (
    TenantRegistrationView, TenantDetailView, TenantPublicView, MyTenantView,
    TenantAdminListView, TenantAdminDetailView, TenantAdminMembersView, TenantAdminOrdersView,
    TenantCopyView,
)

urlpatterns = [
    path('register/', TenantRegistrationView.as_view(), name='tenant-register'),
    path('me/', TenantDetailView.as_view(), name='tenant-detail'),
    path('mine/', MyTenantView.as_view(), name='tenant-mine'),
    path('public/', TenantPublicView.as_view(), name='tenant-public'),
    path('admin/', TenantAdminListView.as_view(), name='tenant-admin-list'),
    path('admin/copy/', TenantCopyView.as_view(), name='tenant-copy'),
    path('admin/<slug:slug>/', TenantAdminDetailView.as_view(), name='tenant-admin-detail'),
    path('admin/<slug:slug>/members/', TenantAdminMembersView.as_view(), name='tenant-admin-members'),
    path('admin/<slug:slug>/orders/', TenantAdminOrdersView.as_view(), name='tenant-admin-orders'),
]
