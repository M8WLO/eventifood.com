from django.urls import path
from .views import (
    PaymentStatusView,
    AlternativeProviderView,
    StripeConnectInitView,
    StripeConnectDisconnectView,
    CreateCheckoutSessionView,
    StripeWebhookView,
)

urlpatterns = [
    path('status/', PaymentStatusView.as_view(), name='payment-status'),
    path('providers/', AlternativeProviderView.as_view(), name='alternative-providers'),
    path('connect/', StripeConnectInitView.as_view(), name='stripe-connect-init'),
    path('connect/disconnect/', StripeConnectDisconnectView.as_view(), name='stripe-connect-disconnect'),
    path('checkout/', CreateCheckoutSessionView.as_view(), name='stripe-checkout'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
