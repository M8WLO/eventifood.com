from django.urls import path
from .views import SubscriptionStatusView, StripeWebhookView, AdminPlanListView, PlanDetailView, PlanListView

urlpatterns = [
    path('status/', SubscriptionStatusView.as_view(), name='subscription-status'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('plans/admin/', AdminPlanListView.as_view(), name='plan-admin-list'),
    path('plans/<int:pk>/', PlanDetailView.as_view(), name='plan-detail'),
]
