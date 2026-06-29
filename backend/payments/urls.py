from django.urls import path
from .views import (
    PaymentStatusView,
    AlternativeProviderView,
    StripeConnectInitView,
    StripeConnectDisconnectView,
    CreateCheckoutSessionView,
    StripeWebhookView,
    PayPalCheckoutCreateView,
    PayPalCheckoutCaptureView,
    PayPalCheckoutWebhookView,
    GoCardlessRedirectView,
    GoCardlessCompleteView,
    GoCardlessWebhookView,
)

urlpatterns = [
    path('status/', PaymentStatusView.as_view(), name='payment-status'),
    path('providers/', AlternativeProviderView.as_view(), name='alternative-providers'),
    path('connect/', StripeConnectInitView.as_view(), name='stripe-connect-init'),
    path('connect/disconnect/', StripeConnectDisconnectView.as_view(), name='stripe-connect-disconnect'),
    path('checkout/', CreateCheckoutSessionView.as_view(), name='stripe-checkout'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    # PayPal customer checkout (orders, not subscriptions)
    path('paypal/create/', PayPalCheckoutCreateView.as_view(), name='paypal-checkout-create'),
    path('paypal/capture/', PayPalCheckoutCaptureView.as_view(), name='paypal-checkout-capture'),
    path('paypal/webhook/', PayPalCheckoutWebhookView.as_view(), name='paypal-checkout-webhook'),
    # GoCardless platform subscription billing
    path('gocardless/redirect/', GoCardlessRedirectView.as_view(), name='gocardless-redirect'),
    path('gocardless/complete/', GoCardlessCompleteView.as_view(), name='gocardless-complete'),
    path('gocardless/webhook/', GoCardlessWebhookView.as_view(), name='gocardless-webhook'),
]
