from django.urls import path
from .views import SubscriptionStatusView, StripeWebhookView

urlpatterns = [
    path('status/', SubscriptionStatusView.as_view(), name='subscription-status'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
