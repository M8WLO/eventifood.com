from django.urls import path
from .views import (
    TenantRegistrationView, TenantDetailView, TenantPublicView, MyTenantView,
    TenantAdminListView, TenantAdminDetailView, TenantAdminMembersView, TenantAdminOrdersView,
    TenantCopyView, ActivePromotionView, PromotionListView, PromotionDetailView, ContactView,
    TenantMapView, TenantLocationView,
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
    path('promotions/active/', ActivePromotionView.as_view(), name='promotion-active'),
    path('promotions/', PromotionListView.as_view(), name='promotion-list'),
    path('promotions/<int:pk>/', PromotionDetailView.as_view(), name='promotion-detail'),
    path('contact/', ContactView.as_view(), name='contact'),
    path('map/', TenantMapView.as_view(), name='tenant-map'),
    path('admin/<slug:slug>/location/', TenantLocationView.as_view(), name='tenant-location'),
]
