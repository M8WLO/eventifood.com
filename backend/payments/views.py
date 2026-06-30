import os
import json
import stripe
from decimal import Decimal
from django.db import models
from django.http import HttpResponseRedirect
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission

from .models import TenantPaymentProvider
from .serializers import PaymentProviderSerializer
from . import paypal_orders_client
from .sandbox_helpers import get_stripe_key, get_gocardless_webhook_secret


def _stripe_client():
    stripe.api_key = get_stripe_key()
    return stripe


def _sandbox_active() -> bool:
    from accounts.models import PlatformConfig
    try:
        return PlatformConfig.get().sandbox_mode
    except Exception:
        return False


def _provider_status(tenant):
    """Return full payment provider status dict for a tenant."""
    sandbox = _sandbox_active()
    try:
        p = tenant.payment_provider
        return {
            'sandbox_mode': sandbox,
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
            'sandbox_mode': sandbox,
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
            # Allow demo stores and sandbox mode to configure providers for testing
            try:
                from accounts.models import PlatformConfig
                sandbox = PlatformConfig.get().sandbox_mode
            except Exception:
                sandbox = False
            if not (tenant.is_demo or sandbox):
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

        # PayPal
        if 'paypal_merchant_id' in data:
            email = data['paypal_merchant_id'].strip()
            provider.paypal_merchant_id = email
            provider.paypal_onboarding_complete = bool(email)
            updated.extend(['paypal_merchant_id', 'paypal_onboarding_complete'])

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


class StripeConnectSyncView(APIView):
    """Poll Stripe API to check charges_enabled and update our DB. Handles the case where
    the webhook hasn't arrived yet (e.g. no Stripe CLI in test/local environments)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            provider = tenant.payment_provider
        except TenantPaymentProvider.DoesNotExist:
            return Response({'stripe_onboarding_complete': False})
        if not provider.stripe_account_id:
            return Response({'stripe_onboarding_complete': False})
        try:
            s = _stripe_client()
            account = s.Account.retrieve(provider.stripe_account_id)
            charges_enabled = account.get('charges_enabled', False)
            if charges_enabled and not provider.stripe_onboarding_complete:
                provider.stripe_onboarding_complete = True
                provider.connected_at = provider.connected_at or timezone.now()
                provider.save()
            return Response({'stripe_onboarding_complete': provider.stripe_onboarding_complete})
        except stripe.error.StripeError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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


class _IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_superadmin', False))


class StripeAdminResetView(APIView):
    """Superadmin: clear a tenant's Stripe Connect link so they can reconnect from scratch."""
    permission_classes = [_IsSuperAdmin]

    def post(self, request, slug):
        from tenants.models import Tenant
        try:
            tenant = Tenant.objects.get(slug=slug)
        except Tenant.DoesNotExist:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            provider = tenant.payment_provider
            old_id = provider.stripe_account_id
            provider.stripe_account_id = ''
            provider.stripe_onboarding_complete = False
            provider.connected_at = None
            provider.save()
            return Response({'detail': f'Stripe Connect reset. Cleared account: {old_id or "(none)"}'})
        except TenantPaymentProvider.DoesNotExist:
            return Response({'detail': 'No payment provider record for this tenant.'}, status=status.HTTP_404_NOT_FOUND)


class StripeAdminStatusView(APIView):
    """Superadmin: fetch current Stripe Connect status for a tenant."""
    permission_classes = [_IsSuperAdmin]

    def get(self, request, slug):
        from tenants.models import Tenant
        try:
            tenant = Tenant.objects.get(slug=slug)
        except Tenant.DoesNotExist:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            provider = tenant.payment_provider
            return Response({
                'stripe_account_id': provider.stripe_account_id,
                'stripe_onboarding_complete': provider.stripe_onboarding_complete,
                'connected_at': provider.connected_at,
            })
        except TenantPaymentProvider.DoesNotExist:
            return Response({'stripe_account_id': '', 'stripe_onboarding_complete': False, 'connected_at': None})


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
        # PAYG: platform fee taken from the tenant's plan. Own plan (subscription): 0%.
        if tenant.payment_mode == 'payg':
            try:
                fee_percent = tenant.tenant_plan.plan.platform_fee_percent
            except Exception:
                fee_percent = Decimal('2.00')
            platform_fee_pence = int(discounted_total * fee_percent / 100 * 100)
        else:
            platform_fee_pence = 0
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


def _build_order_data(request, tenant):
    """
    Parse and validate basket items from request.data.
    Returns (line_items_for_stripe, order_items_list, total, discount info)
    or raises ValueError with a human-readable message.
    Shared between Stripe and PayPal checkout.
    """
    from catalog.models import ProductVariation, ProductExtra
    buyer_name = request.data.get('buyer_name', '').strip()
    buyer_email = request.data.get('buyer_email', '').strip()
    buyer_phone = request.data.get('buyer_phone', '').strip()
    notes = request.data.get('notes', '').strip()
    items_data = request.data.get('items', [])
    raw_discount_code = request.data.get('discount_code', '').upper().strip()

    if not buyer_name or not buyer_email:
        raise ValueError('Name and email are required.')
    if not items_data:
        raise ValueError('Basket is empty.')

    order_items = []
    total = Decimal('0.00')

    for item_data in items_data:
        try:
            variation = ProductVariation.objects.select_related(
                'product__category__tenant'
            ).get(pk=item_data['variation_id'], product__category__tenant=tenant)
        except ProductVariation.DoesNotExist:
            raise ValueError('Item not found.')
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
    return {
        'buyer_name': buyer_name,
        'buyer_email': buyer_email,
        'buyer_phone': buyer_phone,
        'notes': notes,
        'order_items': order_items,
        'discount_amount': discount_amount,
        'applied_code': applied_code,
        'discounted_total': discounted_total,
    }


def _create_order_record(tenant, parsed):
    """Create a pending Order from parsed basket data. Returns the Order instance."""
    from orders.models import Order, OrderItem, OrderItemExtra
    from orders.views import _next_order_numbers

    order_number, daily_number, trading_date = _next_order_numbers(tenant)
    order = Order.objects.create(
        tenant=tenant,
        order_number=order_number,
        daily_number=daily_number,
        trading_date=trading_date,
        total=parsed['discounted_total'],
        discount_code=parsed['applied_code'],
        discount_amount=parsed['discount_amount'],
        buyer_name=parsed['buyer_name'],
        buyer_email=parsed['buyer_email'],
        buyer_phone=parsed['buyer_phone'],
        notes=parsed['notes'],
        status='pending_payment',
    )
    for item in parsed['order_items']:
        resolved_extras = item.pop('resolved_extras')
        order_item = OrderItem.objects.create(order=order, **item)
        for extra in resolved_extras:
            OrderItemExtra.objects.create(
                order_item=order_item,
                extra=extra,
                name=extra.name,
                additional_price=extra.additional_price,
            )
    return order


def _activate_order(order):
    """Mark an order as placed and send the confirmation email."""
    from notifications.services import send_order_confirmation_email
    if order.status != 'pending_payment':
        return  # already activated (idempotent)
    order.status = 'placed'
    order.save(update_fields=['status'])
    send_order_confirmation_email(order)


class PayPalCheckoutCreateView(APIView):
    """
    POST /api/payments/paypal/create/
    Creates a pending order + PayPal order for a customer.
    Returns { order_number, paypal_order_id, approval_url }.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only subscription tenants with PayPal configured can use this
        try:
            provider = tenant.payment_provider
            if not provider.paypal_onboarding_complete or not provider.paypal_merchant_id:
                return Response(
                    {'detail': 'This store has not set up PayPal payments.'},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
            payee_email = provider.paypal_merchant_id
        except TenantPaymentProvider.DoesNotExist:
            return Response(
                {'detail': 'This store has not set up PayPal payments.'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        try:
            parsed = _build_order_data(request, tenant)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        order = _create_order_record(tenant, parsed)

        # Demo / sandbox shortcut — skip real PayPal and confirm immediately
        if _sandbox_active() or getattr(tenant, 'is_demo', False):
            _activate_order(order)
            return Response({
                'order_number': order.order_number,
                'paypal_order_id': f'demo_{order.order_number}',
                'approval_url': f'https://{tenant.slug}.eventifood.com/store/{tenant.slug}/order/{order.order_number}?paid=1',
            })

        frontend_url = os.environ.get('FRONTEND_URL', 'https://eventifood.com')
        backend_url = os.environ.get('BACKEND_URL', request.build_absolute_uri('/').rstrip('/'))

        return_url = f'{backend_url}/api/payments/paypal/capture/'
        cancel_url = f'https://{tenant.slug}.eventifood.com/store/{tenant.slug}/basket?paypal_cancelled=1'

        try:
            result = paypal_orders_client.create_order(
                amount_gbp=str(parsed['discounted_total']),
                payee_email=payee_email,
                order_number=order.order_number,
                store_name=tenant.name,
                return_url=return_url,
                cancel_url=cancel_url,
            )
        except Exception as e:
            order.delete()
            return Response({'detail': f'PayPal error: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        order.paypal_order_id = result['id']
        order.save(update_fields=['paypal_order_id'])

        # Store order number in sessionStorage-friendly response for basket to track
        from discounts.models import DiscountCode
        if parsed['applied_code']:
            DiscountCode.objects.filter(tenant=tenant, code=parsed['applied_code']).update(
                times_used=models.F('times_used') + 1
            )

        return Response({
            'order_number': order.order_number,
            'paypal_order_id': result['id'],
            'approval_url': result['approval_url'],
        })


class PayPalCheckoutCaptureView(APIView):
    """
    GET /api/payments/paypal/capture/?token=PAYPAL_ORDER_ID
    PayPal redirects here after customer approves. Captures payment and activates order.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from orders.models import Order

        paypal_order_id = request.query_params.get('token')
        if not paypal_order_id:
            return HttpResponseRedirect('https://eventifood.com?paypal_error=missing_token')

        order = Order.objects.filter(paypal_order_id=paypal_order_id, status='pending_payment').first()
        if not order:
            # May already be activated via webhook — check
            order = Order.objects.filter(paypal_order_id=paypal_order_id).first()
            if order and order.status != 'pending_payment':
                frontend_url = f'https://{order.tenant.slug}.eventifood.com'
                return HttpResponseRedirect(f'{frontend_url}/store/{order.tenant.slug}/order/{order.order_number}?paid=1')
            return HttpResponseRedirect('https://eventifood.com?paypal_error=order_not_found')

        tenant = order.tenant

        try:
            capture_data = paypal_orders_client.capture_order(paypal_order_id)
        except Exception as e:
            frontend_url = f'https://{tenant.slug}.eventifood.com'
            return HttpResponseRedirect(
                f'{frontend_url}/store/{tenant.slug}/basket?paypal_error=capture_failed'
            )

        capture_status = capture_data.get('status', '')
        if capture_status == 'COMPLETED':
            _activate_order(order)
            frontend_url = f'https://{tenant.slug}.eventifood.com'
            return HttpResponseRedirect(
                f'{frontend_url}/store/{tenant.slug}/order/{order.order_number}?paid=1'
            )

        # Payment not completed — send back to basket with error
        frontend_url = f'https://{tenant.slug}.eventifood.com'
        return HttpResponseRedirect(
            f'{frontend_url}/store/{tenant.slug}/basket?paypal_error=not_completed'
        )


class PayPalCheckoutWebhookView(APIView):
    """
    POST /api/payments/paypal/webhook/
    Handles PAYMENT.CAPTURE.COMPLETED as a fallback if the redirect capture failed.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from orders.models import Order

        event_type = request.data.get('event_type', '')
        if event_type != 'PAYMENT.CAPTURE.COMPLETED':
            return Response({'received': True})

        resource = request.data.get('resource', {})
        # custom_id was set to order_number when the PayPal order was created
        order_number = resource.get('custom_id', '')
        if not order_number:
            return Response({'received': True})

        try:
            order = Order.objects.get(order_number=order_number, status='pending_payment')
            _activate_order(order)
        except Order.DoesNotExist:
            pass  # already activated or unknown

        return Response({'received': True})


# ─── GoCardless platform subscription billing ───────────────────────────────


class GoCardlessRedirectView(APIView):
    """
    POST /api/payments/gocardless/redirect/
    Creates a GoCardless redirect flow so a seller can authorise a Direct Debit
    mandate for their Eventifood subscription fee.
    Body: { plan_id: int, period: 'monthly' | 'annual' }
    Returns: { redirect_url, session_token }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import uuid
        from subscriptions.models import Plan
        from .gocardless_billing_client import create_redirect_flow

        plan_id = request.data.get('plan_id')
        period = request.data.get('period', 'monthly')

        if not plan_id:
            return Response({'detail': 'plan_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = Plan.objects.get(pk=plan_id, is_active=True, billing_model='subscription')
        except Plan.DoesNotExist:
            return Response({'detail': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)

        session_token = str(uuid.uuid4())
        frontend_url = os.environ.get('FRONTEND_URL', 'https://eventifood.com')
        success_redirect_url = f'{frontend_url}/seller/payment-portal/gocardless/callback'

        try:
            flow = create_redirect_flow(
                description=f'Eventifood {plan.name} subscription',
                session_token=session_token,
                success_redirect_url=success_redirect_url,
                prefilled_email=request.user.email,
            )
        except Exception as e:
            return Response({'detail': f'GoCardless error: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'redirect_url': flow.redirect_url, 'session_token': session_token})


class GoCardlessCompleteView(APIView):
    """
    POST /api/payments/gocardless/complete/
    Completes the redirect flow, creates the GC subscription, activates TenantPlan.
    Body: { redirect_flow_id, session_token, plan_id, period }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from subscriptions.models import Plan, Subscription, TenantPlan
        from .gocardless_billing_client import complete_redirect_flow, create_subscription as gc_create_subscription

        redirect_flow_id = request.data.get('redirect_flow_id')
        session_token = request.data.get('session_token')
        plan_id = request.data.get('plan_id')
        period = request.data.get('period', 'monthly')

        if not all([redirect_flow_id, session_token, plan_id]):
            return Response(
                {'detail': 'redirect_flow_id, session_token, and plan_id are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            plan = Plan.objects.get(pk=plan_id, is_active=True, billing_model='subscription')
        except Plan.DoesNotExist:
            return Response({'detail': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            flow = complete_redirect_flow(redirect_flow_id, session_token)
        except Exception as e:
            return Response(
                {'detail': f'Could not complete GoCardless authorisation: {e}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mandate_id = flow.links.mandate

        if period == 'annual':
            amount_pence = int(plan.annual_price * 100)
            interval_unit = 'yearly'
            sub_plan = 'annual'
        else:
            amount_pence = int(plan.monthly_price * 100)
            interval_unit = 'monthly'
            sub_plan = 'monthly_split'

        try:
            gc_sub = gc_create_subscription(
                mandate_id=mandate_id,
                amount_pence=amount_pence,
                interval_unit=interval_unit,
                name=f'Eventifood {plan.name}',
                metadata={'tenant_slug': tenant.slug, 'plan_id': str(plan.pk), 'period': period},
            )
        except Exception as e:
            return Response(
                {'detail': f'GoCardless subscription error: {e}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Persist the subscription record
        subscription, _ = Subscription.objects.get_or_create(tenant=tenant)
        subscription.plan_tier = plan
        subscription.plan = sub_plan
        subscription.status = 'active'
        subscription.gocardless_mandate_id = mandate_id
        subscription.gocardless_subscription_id = gc_sub.id
        subscription.payment_provider = 'gocardless'
        subscription.annual_cost = plan.annual_price if period == 'annual' else plan.monthly_price * 12
        subscription.started_at = timezone.now()
        subscription.save()

        # Activate the tenant's plan tier
        tenant_plan, _ = TenantPlan.objects.get_or_create(tenant=tenant)
        tenant_plan.set_plan(plan, user=request.user)

        return Response({'success': True, 'plan_name': plan.name})


class GoCardlessWebhookView(APIView):
    """
    POST /api/payments/gocardless/webhook/
    Receives GoCardless event notifications. Verifies the HMAC-SHA256 signature.
    Handles: mandates.cancelled, subscriptions.cancelled, payments.failed
    """
    permission_classes = [AllowAny]

    def post(self, request):
        import hashlib
        import hmac as hmac_module
        from subscriptions.models import Subscription

        webhook_secret = get_gocardless_webhook_secret()
        sig_header = request.META.get('HTTP_WEBHOOK_SIGNATURE', '')

        if webhook_secret and sig_header:
            expected = hmac_module.new(
                webhook_secret.encode('utf-8'),
                request.body,
                hashlib.sha256,
            ).hexdigest()
            if not hmac_module.compare_digest(expected, sig_header):
                return Response({'detail': 'Invalid signature.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            payload = json.loads(request.body)
        except (ValueError, KeyError):
            return Response({'detail': 'Bad payload.'}, status=status.HTTP_400_BAD_REQUEST)

        for event in payload.get('events', []):
            resource_type = event.get('resource_type', '')
            action = event.get('action', '')
            links = event.get('links', {})

            if resource_type == 'mandates' and action == 'cancelled':
                mandate_id = links.get('mandate', '')
                if mandate_id:
                    Subscription.objects.filter(gocardless_mandate_id=mandate_id).update(
                        status='cancelled'
                    )

            elif resource_type == 'subscriptions' and action == 'cancelled':
                gc_sub_id = links.get('subscription', '')
                if gc_sub_id:
                    Subscription.objects.filter(gocardless_subscription_id=gc_sub_id).update(
                        status='cancelled'
                    )

            elif resource_type == 'payments' and action == 'failed':
                # Payment failed — mark past_due for the associated mandate if we can identify it
                mandate_id = links.get('mandate', '')
                if mandate_id:
                    Subscription.objects.filter(
                        gocardless_mandate_id=mandate_id,
                        status='active',
                    ).update(status='past_due')

        return Response({'received': True})
