import json
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Subscription
from .serializers import SubscriptionSerializer


class SubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            sub = tenant.subscription
        except Subscription.DoesNotExist:
            return Response({'detail': 'No subscription found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SubscriptionSerializer(sub).data)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if settings.TEST_MODE:
            return Response({'detail': 'Webhook disabled in TEST_MODE.'})

        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            import stripe
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, Exception) as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'invoice.paid':
            customer_id = event['data']['object'].get('customer')
            sub = Subscription.objects.filter(stripe_customer_id=customer_id).first()
            if sub:
                sub.status = 'active'
                sub.save()

        elif event['type'] == 'customer.subscription.deleted':
            stripe_sub_id = event['data']['object']['id']
            sub = Subscription.objects.filter(stripe_subscription_id=stripe_sub_id).first()
            if sub:
                sub.status = 'cancelled'
                sub.save()

        return Response({'received': True})
