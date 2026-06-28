from django.urls import path
from .views import (
    PaymentStatusView,
    StripeConnectInitView,
    StripeConnectCallbackView,
    StripeConnectDisconnectView,
    StripeWebhookView,
)

urlpatterns = [
    path('status/', PaymentStatusView.as_view(), name='payment-status'),
    path('connect/', StripeConnectInitView.as_view(), name='stripe-connect-init'),
    path('connect/callback/', StripeConnectCallbackView.as_view(), name='stripe-connect-callback'),
    path('connect/disconnect/', StripeConnectDisconnectView.as_view(), name='stripe-connect-disconnect'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
