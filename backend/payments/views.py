import os
import stripe
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import TenantPaymentProvider
from .serializers import PaymentProviderSerializer


def _stripe_client():
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
    return stripe


class PaymentStatusView(APIView):
    """Return payment provider status for the current tenant."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            provider = tenant.payment_provider
            return Response({
                'payment_mode': tenant.payment_mode,
                'stripe_account_id': provider.stripe_account_id,
                'stripe_onboarding_complete': provider.stripe_onboarding_complete,
                'connected_at': provider.connected_at,
            })
        except TenantPaymentProvider.DoesNotExist:
            return Response({
                'payment_mode': tenant.payment_mode,
                'stripe_account_id': '',
                'stripe_onboarding_complete': False,
                'connected_at': None,
            })


class StripeConnectInitView(APIView):
    """Return the Stripe Connect OAuth URL for this tenant."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        client_id = os.environ.get('STRIPE_CLIENT_ID', '')
        if not client_id:
            return Response({'detail': 'Stripe Connect not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        redirect_uri = os.environ.get('STRIPE_CONNECT_REDIRECT_URI', 'https://eventifood.com/seller/settings/payments/stripe/callback')
        url = (
            f"https://connect.stripe.com/oauth/authorize"
            f"?response_type=code"
            f"&client_id={client_id}"
            f"&scope=read_write"
            f"&redirect_uri={redirect_uri}"
            f"&state={tenant.slug}"
        )
        return Response({'url': url})


class StripeConnectCallbackView(APIView):
    """Exchange OAuth code for a Stripe account ID."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        code = request.data.get('code', '').strip()
        if not code:
            return Response({'detail': 'Missing OAuth code.'}, status=status.HTTP_400_BAD_REQUEST)
        s = _stripe_client()
        try:
            response = s.OAuth.token(grant_type='authorization_code', code=code)
            account_id = response['stripe_user_id']
        except stripe.oauth_error.OAuthError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        provider, _ = TenantPaymentProvider.objects.get_or_create(tenant=tenant)
        provider.stripe_account_id = account_id
        provider.stripe_onboarding_complete = True
        provider.connected_at = timezone.now()
        provider.save()
        return Response(PaymentProviderSerializer(provider).data)


class StripeConnectDisconnectView(APIView):
    """Disconnect Stripe account from this tenant."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            provider = tenant.payment_provider
            s = _stripe_client()
            client_id = os.environ.get('STRIPE_CLIENT_ID', '')
            if provider.stripe_account_id and client_id:
                try:
                    s.OAuth.deauthorize(
                        client_id=client_id,
                        stripe_user_id=provider.stripe_account_id,
                    )
                except Exception:
                    pass
            provider.stripe_account_id = ''
            provider.stripe_onboarding_complete = False
            provider.connected_at = None
            provider.save()
        except TenantPaymentProvider.DoesNotExist:
            pass
        return Response({'detail': 'Disconnected.'})


class StripeWebhookView(APIView):
    """Handle Stripe webhook events."""
    permission_classes = [AllowAny]

    def post(self, request):
        webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        payload = request.body
        s = _stripe_client()
        try:
            if webhook_secret:
                event = s.Webhook.construct_event(payload, sig_header, webhook_secret)
            else:
                import json
                event = json.loads(payload)
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get('type', '')

        if event_type == 'account.updated':
            account = event['data']['object']
            account_id = account['id']
            charges_enabled = account.get('charges_enabled', False)
            try:
                provider = TenantPaymentProvider.objects.get(stripe_account_id=account_id)
                if charges_enabled and not provider.stripe_onboarding_complete:
                    provider.stripe_onboarding_complete = True
                    provider.connected_at = provider.connected_at or timezone.now()
                    provider.save()
            except TenantPaymentProvider.DoesNotExist:
                pass

        return Response({'received': True})
