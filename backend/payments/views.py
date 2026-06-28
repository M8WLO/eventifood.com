import os
import json
import stripe
from decimal import Decimal
from django.db import models
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


def _provider_status(tenant):
    """Return full payment provider status dict for a tenant."""
    try:
        p = tenant.payment_provider
        return {
            'payment_mode': tenant.payment_mode,
            'stripe_account_id': p.stripe_account_id,
            'stripe_onboarding_complete': p.stripe_onboarding_complete,
            'connected_at': p.connected_at,
            'paypal_merchant_id': p.paypal_merchant_id,
            'paypal_onboarding_complete': p.paypal_onboarding_complete,
            'sumup_merchant_code': p.sumup_merchant_code,
            'sumup_enabled': p.sumup_enabled,
            'sumup_has_key': bool(p.sumup_api_key),
            'gocardless_enabled': p.gocardless_enabled,
            'gocardless_has_token': bool(p.gocardless_access_token),
        }
    except TenantPaymentProvider.DoesNotExist:
        return {
            'payment_mode': tenant.payment_mode,
            'stripe_account_id': '',
            'stripe_onboarding_complete': False,
            'connected_at': None,
            'paypal_merchant_id': '',
            'paypal_onboarding_complete': False,
            'sumup_merchant_code': '',
            'sumup_enabled': False,
            'sumup_has_key': False,
            'gocardless_enabled': False,
            'gocardless_has_token': False,
        }


class PaymentStatusView(APIView):
    """Return payment provider status for the current tenant."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(_provider_status(tenant))


class AlternativeProviderView(APIView):
    """GET/PATCH alternative payment provider settings (PayPal, SumUp, GoCardless)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(_provider_status(tenant))

    def patch(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        if tenant.payment_mode == 'payg':
            return Response({'detail': 'Alternative providers are not available on Pay As You Go.'}, status=status.HTTP_403_FORBIDDEN)
        provider, _ = TenantPaymentProvider.objects.get_or_create(tenant=tenant)
        data = request.data
        updated = []

        # SumUp
        if 'sumup_api_key' in data:
            provider.sumup_api_key = data['sumup_api_key'].strip()
            updated.append('sumup_api_key')
        if 'sumup_merchant_code' in data:
            provider.sumup_merchant_code = data['sumup_merchant_code'].strip()
            updated.append('sumup_merchant_code')
        if 'sumup_enabled' in data:
            provider.sumup_enabled = bool(data['sumup_enabled'])
            if provider.sumup_enabled and not provider.sumup_api_key:
                return Response({'detail': 'Add an API key before enabling SumUp.'}, status=status.HTTP_400_BAD_REQUEST)
            updated.append('sumup_enabled')

        # GoCardless
        if 'gocardless_access_token' in data:
            provider.gocardless_access_token = data['gocardless_access_token'].strip()
            updated.append('gocardless_access_token')
        if 'gocardless_enabled' in data:
            provider.gocardless_enabled = bool(data['gocardless_enabled'])
            if provider.gocardless_enabled and not provider.gocardless_access_token:
                return Response({'detail': 'Add an access token before enabling GoCardless.'}, status=status.HTTP_400_BAD_REQUEST)
            updated.append('gocardless_enabled')

        if updated:
            provider.save(update_fields=updated)
        return Response(_provider_status(tenant))


class StripeConnectInitView(APIView):
    """Create (or reuse) a Stripe Express account and return an Account Link URL."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = _stripe_client()
        provider, _ = TenantPaymentProvider.objects.get_or_create(tenant=tenant)
        if not provider.stripe_account_id:
            try:
                account = s.Account.create(
                    type='express',
                    country='GB',
                    email=request.user.email,
                    capabilities={
                        'card_payments': {'requested': True},
                        'transfers': {'requested': True},
                    },
                )
                provider.stripe_account_id = account.id
                provider.save()
            except stripe.error.StripeError as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        frontend_url = os.environ.get('FRONTEND_URL', 'https://eventifood.com')
        try:
            link = s.AccountLink.create(
                account=provider.stripe_account_id,
                refresh_url=f"{frontend_url}/seller/settings/payments/stripe",
                return_url=f"{frontend_url}/seller/settings/payments/stripe/callback",
                type='account_onboarding',
            )
        except stripe.error.StripeError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'url': link.url})


class StripeConnectDisconnectView(APIView):
    """Disconnect Stripe account from this tenant."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            provider = tenant.payment_provider
            provider.stripe_account_id = ''
            provider.stripe_onboarding_complete = False
            provider.connected_at = None
            provider.save()
        except TenantPaymentProvider.DoesNotExist:
            pass
        return Response({'detail': 'Disconnected.'})


class CreateCheckoutSessionView(APIView):
    """Create a Stripe Checkout Session for a customer basket."""
    permission_classes = [AllowAny]

    def post(self, request):
        from catalog.models import ProductVariation, ProductExtra
        from orders.models import Order
        from orders.views import _next_order_numbers

        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check seller has Stripe Connect set up
        try:
            provider = tenant.payment_provider
            if not provider.stripe_account_id:
                return Response(
                    {'detail': 'This store is not yet set up to accept card payments.'},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
        except TenantPaymentProvider.DoesNotExist:
            return Response(
                {'detail': 'This store is not yet set up to accept card payments.'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        buyer_name = request.data.get('buyer_name', '').strip()
        buyer_email = request.data.get('buyer_email', '').strip()
        buyer_phone = request.data.get('buyer_phone', '').strip()
        notes = request.data.get('notes', '').strip()
        items_data = request.data.get('items', [])
        raw_discount_code = request.data.get('discount_code', '').upper().strip()

        if not buyer_name or not buyer_email:
            return Response({'detail': 'Name and email are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not items_data:
            return Response({'detail': 'Basket is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve items and build Stripe line items
        line_items = []
        order_items = []
        total = Decimal('0.00')

        for item_data in items_data:
            try:
                variation = ProductVariation.objects.select_related(
                    'product__category__tenant'
                ).get(pk=item_data['variation_id'], product__category__tenant=tenant)
            except ProductVariation.DoesNotExist:
                return Response(
                    {'detail': f"Item not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            extra_ids = item_data.get('extras', [])
            resolved_extras = []
            extras_cost = Decimal('0.00')
            for extra_id in extra_ids:
                try:
                    extra = ProductExtra.objects.get(pk=extra_id, product=variation.product)
                    resolved_extras.append(extra)
                    extras_cost += extra.additional_price
                except ProductExtra.DoesNotExist:
                    pass

            qty = int(item_data.get('quantity', 1))
            item_price = variation.retail_price + extras_cost
            subtotal = item_price * qty
            total += subtotal

            description_parts = [variation.name]
            if resolved_extras:
                description_parts.append(', '.join(e.name for e in resolved_extras))

            line_items.append({
                'price_data': {
                    'currency': 'gbp',
                    'unit_amount': int(item_price * 100),
                    'product_data': {
                        'name': variation.product.name,
                        'description': ' + '.join(description_parts) if len(description_parts) > 1 else variation.name,
                    },
                },
                'quantity': qty,
            })
            order_items.append({
                'variation': variation,
                'product_name': variation.product.name,
                'variation_name': variation.name,
                'retail_price': item_price,
                'cost_price': variation.cost_price,
                'quantity': qty,
                'subtotal': subtotal,
                'resolved_extras': resolved_extras,
            })

        # Apply discount code if provided
        discount_amount = Decimal('0.00')
        applied_code = ''
        if raw_discount_code:
            from discounts.models import DiscountCode
            try:
                dc = DiscountCode.objects.get(tenant=tenant, code=raw_discount_code)
                if dc.is_valid():
                    if dc.discount_type == 'percentage':
                        discount_amount = (total * dc.discount_value / 100).quantize(Decimal('0.01'))
                    else:
                        discount_amount = min(dc.discount_value, total)
                    applied_code = dc.code
            except DiscountCode.DoesNotExist:
                pass
        discounted_total = max(total - discount_amount, Decimal('0.01'))

        # Create pending order to get an order number before redirecting
        order_number, daily_number, trading_date = _next_order_numbers(tenant)
        order = Order.objects.create(
            tenant=tenant,
            order_number=order_number,
            daily_number=daily_number,
            trading_date=trading_date,
            total=discounted_total,
            discount_code=applied_code,
            discount_amount=discount_amount,
            buyer_name=buyer_name,
            buyer_email=buyer_email,
            buyer_phone=buyer_phone,
            notes=notes,
            status='pending_payment',
        )
        from orders.models import OrderItem, OrderItemExtra
        for item in order_items:
            resolved_extras = item.pop('resolved_extras')
            order_item = OrderItem.objects.create(order=order, **item)
            for extra in resolved_extras:
                OrderItemExtra.objects.create(
                    order_item=order_item,
                    extra=extra,
                    name=extra.name,
                    additional_price=extra.additional_price,
                )

        # Create Stripe Checkout Session
        frontend_url = os.environ.get('FRONTEND_URL', 'https://eventifood.com')
        # PAYG: 2% platform fee on the discounted total. Own plan: 0%.
        platform_fee_pence = int(discounted_total * Decimal('0.02') * 100) if tenant.payment_mode == 'payg' else 0
        s = _stripe_client()
        # Add a discount line item if applicable (negative Stripe coupon approach)
        session_kwargs = {}
        if discount_amount > 0:
            coupon = s.Coupon.create(
                amount_off=int(discount_amount * 100),
                currency='gbp',
                duration='once',
                name=f'Discount: {applied_code}',
            )
            session_kwargs['discounts'] = [{'coupon': coupon.id}]

        try:
            session = s.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                customer_email=buyer_email,
                success_url=f"{frontend_url}/store/{tenant.slug}/order/{order_number}?paid=1",
                cancel_url=f"{frontend_url}/store/{tenant.slug}/basket",
                payment_intent_data={
                    'application_fee_amount': platform_fee_pence,
                    'transfer_data': {'destination': provider.stripe_account_id},
                },
                metadata={
                    'order_id': str(order.id),
                    'tenant_slug': tenant.slug,
                },
                **session_kwargs,
            )
        except stripe.error.StripeError as e:
            order.delete()
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        order.stripe_session_id = session.id
        order.save(update_fields=['stripe_session_id'])

        # Increment usage counter after the session is confirmed
        if applied_code:
            from discounts.models import DiscountCode
            DiscountCode.objects.filter(tenant=tenant, code=applied_code).update(
                times_used=models.F('times_used') + 1
            )

        return Response({'url': session.url, 'order_number': order_number})


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

        elif event_type == 'checkout.session.completed':
            session = event['data']['object']
            payment_status = session.get('payment_status')
            order_id = session.get('metadata', {}).get('order_id')
            if order_id and payment_status == 'paid':
                from orders.models import Order
                from notifications.services import send_order_confirmation_email
                try:
                    order = Order.objects.get(id=order_id, status='pending_payment')
                    order.status = 'placed'
                    order.save(update_fields=['status'])
                    send_order_confirmation_email(order)
                except Order.DoesNotExist:
                    pass

        elif event_type == 'checkout.session.expired':
            session = event['data']['object']
            order_id = session.get('metadata', {}).get('order_id')
            if order_id:
                from orders.models import Order
                Order.objects.filter(id=order_id, status='pending_payment').delete()

        return Response({'received': True})
