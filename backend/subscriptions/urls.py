from django.urls import path
from .views import (
    SubscriptionStatusView, StripeWebhookView,
    AdminPlanListView, PlanDetailView, PlanListView, AdminSubscriptionView,
    TenantPlanView, AdminTenantPlanView,
)

urlpatterns = [
    path('status/', SubscriptionStatusView.as_view(), name='subscription-status'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('plans/admin/', AdminPlanListView.as_view(), name='plan-admin-list'),
    path('plans/<int:pk>/', PlanDetailView.as_view(), name='plan-detail'),
    path('my-plan/', TenantPlanView.as_view(), name='tenant-plan'),
    path('admin/<slug:slug>/', AdminSubscriptionView.as_view(), name='subscription-admin-detail'),
    path('admin/<slug:slug>/plan/', AdminTenantPlanView.as_view(), name='tenant-plan-admin'),
]
