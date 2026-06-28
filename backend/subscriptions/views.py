import json
import os
from django.conf import settings
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission

from .models import Subscription, Plan, TenantPlan
from .serializers import SubscriptionSerializer, PlanSerializer, AdminSubscriptionSerializer, TenantPlanSerializer


def sync_stripe_prices(plan):
    """Auto-create/update Stripe Product + Prices for a subscription plan."""
    import stripe
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
    if not stripe.api_key:
        return
    if plan.billing_model != 'subscription' or 'stripe' not in (plan.allowed_payment_methods or []):
        return

    # Get or create Stripe Product
    if plan.stripe_product_id:
        try:
            stripe.Product.modify(plan.stripe_product_id, name=plan.name, description=plan.description or '')
        except Exception:
            plan.stripe_product_id = ''

    if not plan.stripe_product_id:
        product = stripe.Product.create(
            name=plan.name,
            description=plan.description or '',
            metadata={'eventifood_plan_slug': plan.slug},
        )
        plan.stripe_product_id = product.id
        plan.save(update_fields=['stripe_product_id'])

    def _sync_price(existing_id, amount_pounds, interval, interval_field):
        if not amount_pounds or float(amount_pounds) <= 0:
            return
        amount_pence = int(float(amount_pounds) * 100)
        if existing_id:
            try:
                existing = stripe.Price.retrieve(existing_id)
                if existing.unit_amount == amount_pence and existing.active:
                    return  # already correct
                if existing.active:
                    stripe.Price.modify(existing_id, active=False)
            except Exception:
                pass
        price = stripe.Price.create(
            product=plan.stripe_product_id,
            unit_amount=amount_pence,
            currency='gbp',
            recurring={'interval': interval},
            metadata={'eventifood_plan_slug': plan.slug, 'period': interval},
        )
        setattr(plan, interval_field, price.id)
        plan.save(update_fields=[interval_field])

    _sync_price(plan.stripe_price_id_monthly, plan.monthly_price, 'month', 'stripe_price_id_monthly')
    _sync_price(plan.stripe_price_id_annual, plan.annual_price, 'year', 'stripe_price_id_annual')


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superadmin)


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

    def patch(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            sub = tenant.subscription
        except Subscription.DoesNotExist:
            return Response({'detail': 'No subscription found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SubscriptionSerializer(sub, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class PlanListView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsSuperAdmin()]

    def get(self, request):
        plans = Plan.objects.filter(is_active=True)
        return Response(PlanSerializer(plans, many=True).data)

    def post(self, request):
        serializer = PlanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        plan = serializer.save()
        sync_stripe_prices(plan)
        return Response(PlanSerializer(plan).data, status=status.HTTP_201_CREATED)


class PlanDetailView(APIView):
    def get_permissions(self):
        return [IsSuperAdmin()]

    def get(self, request, pk):
        try:
            plan = Plan.objects.get(pk=pk)
        except Plan.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(PlanSerializer(plan).data)

    def patch(self, request, pk):
        try:
            plan = Plan.objects.get(pk=pk)
        except Plan.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = PlanSerializer(plan, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        plan = serializer.save()
        sync_stripe_prices(plan)
        return Response(PlanSerializer(plan).data)

    def delete(self, request, pk):
        try:
            plan = Plan.objects.get(pk=pk)
        except Plan.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminPlanListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        plans = Plan.objects.all()
        return Response(PlanSerializer(plans, many=True).data)

    def post(self, request):
        serializer = PlanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        plan = serializer.save()
        sync_stripe_prices(plan)
        return Response(PlanSerializer(plan).data, status=status.HTTP_201_CREATED)


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


class TenantPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_or_create(self, tenant):
        obj, _ = TenantPlan.objects.get_or_create(tenant=tenant)
        return obj

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj = self._get_or_create(tenant)
        return Response(TenantPlanSerializer(obj, context={'request': request}).data)

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        plan_id = request.data.get('plan_id')
        try:
            plan = Plan.objects.get(pk=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response({'detail': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj = self._get_or_create(tenant)
        if not obj.can_change(request.user):
            return Response(
                {'detail': 'Plan can only be changed once every 30 days.',
                 'next_change_allowed_at': obj.next_change_allowed_at},
                status=status.HTTP_403_FORBIDDEN,
            )
        obj.set_plan(plan, user=request.user)
        return Response(TenantPlanSerializer(obj, context={'request': request}).data)


class AdminTenantPlanView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request, slug):
        from tenants.models import Tenant
        try:
            tenant = Tenant.objects.get(slug=slug)
        except Tenant.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj, _ = TenantPlan.objects.get_or_create(tenant=tenant)
        return Response(TenantPlanSerializer(obj, context={'request': request}).data)

    def post(self, request, slug):
        from tenants.models import Tenant
        try:
            tenant = Tenant.objects.get(slug=slug)
        except Tenant.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        plan_id = request.data.get('plan_id')
        try:
            plan = Plan.objects.get(pk=plan_id)
        except Plan.DoesNotExist:
            return Response({'detail': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj, _ = TenantPlan.objects.get_or_create(tenant=tenant)
        obj.set_plan(plan, user=request.user)
        return Response(TenantPlanSerializer(obj, context={'request': request}).data)


class PayPalCreateSubscriptionView(APIView):
    """Seller: initiate a PayPal subscription for their plan.
    POST /api/subscriptions/paypal/create/?period=monthly|annual
    Returns: { approval_url: "https://paypal.com/..." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from . import paypal_client

        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)

        period = request.query_params.get('period', 'monthly')
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response({'detail': 'plan_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = Plan.objects.get(pk=plan_id, is_active=True, billing_model='subscription')
        except Plan.DoesNotExist:
            return Response({'detail': 'Plan not found or not a subscription plan.'}, status=status.HTTP_404_NOT_FOUND)

        if 'paypal' not in (plan.allowed_payment_methods or []):
            return Response({'detail': 'PayPal not available for this plan.'}, status=status.HTTP_400_BAD_REQUEST)

        paypal_plan_id = plan.paypal_plan_id_monthly if period == 'monthly' else plan.paypal_plan_id_annual
        if not paypal_plan_id:
            return Response(
                {'detail': f'No PayPal plan ID configured for {period} billing. Contact support.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        frontend_url = os.environ.get('FRONTEND_URL', 'https://eventifood.com')
        backend_url = os.environ.get('BACKEND_URL', request.build_absolute_uri('/').rstrip('/'))

        return_url = f'{backend_url}/api/subscriptions/paypal/return/?period={period}&plan_id={plan_id}'
        cancel_url = f'{frontend_url}/seller/settings?paypal_cancelled=1'

        try:
            result = paypal_client.create_subscription(
                paypal_plan_id=paypal_plan_id,
                tenant_slug=tenant.slug,
                return_url=return_url,
                cancel_url=cancel_url,
            )
        except Exception as e:
            return Response({'detail': f'PayPal error: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

        # Store the pending subscription_id so we can match it on return
        sub, _ = Subscription.objects.get_or_create(
            tenant=tenant,
            defaults={'status': 'trialing', 'plan_tier': plan},
        )
        sub.paypal_subscription_id = result['id']
        sub.payment_provider = 'paypal'
        sub.plan_tier = plan
        sub.save(update_fields=['paypal_subscription_id', 'payment_provider', 'plan_tier'])

        return Response({'approval_url': result['approval_url']})


class PayPalReturnView(APIView):
    """PayPal redirects here after seller approves or the redirect happens after subscription.
    GET /api/subscriptions/paypal/return/?subscription_id=xxx&period=monthly&plan_id=1
    This is a browser redirect — we verify, activate, then redirect back to the seller frontend.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from . import paypal_client

        subscription_id = request.query_params.get('subscription_id')
        if not subscription_id:
            frontend_url = os.environ.get('FRONTEND_URL', 'https://eventifood.com')
            return HttpResponseRedirect(f'{frontend_url}/seller/settings?paypal_error=missing_id')

        # Look up the subscription by PayPal ID
        sub = Subscription.objects.filter(paypal_subscription_id=subscription_id).first()
        if not sub:
            frontend_url = os.environ.get('FRONTEND_URL', 'https://eventifood.com')
            return HttpResponseRedirect(f'{frontend_url}/seller/settings?paypal_error=not_found')

        try:
            pp_data = paypal_client.get_subscription(subscription_id)
            pp_status = pp_data.get('status', '')
        except Exception:
            pp_status = ''

        tenant = sub.tenant
        frontend_url = os.environ.get('FRONTEND_URL', 'https://eventifood.com')
        # Seller settings is on their subdomain
        seller_settings_url = f'https://{tenant.slug}.eventifood.com/seller/settings'

        if pp_status == 'ACTIVE':
            sub.status = 'active'
            sub.started_at = timezone.now()
            sub.save(update_fields=['status', 'started_at'])
            # Ensure TenantPlan is set to the subscription plan
            if sub.plan_tier:
                tp, _ = TenantPlan.objects.get_or_create(tenant=tenant)
                tp.set_plan(sub.plan_tier)
            return HttpResponseRedirect(f'{seller_settings_url}?paypal_success=1')

        # APPROVAL_PENDING → PayPal sometimes redirects before fully activating.
        # Store and let webhook do the final activation.
        if pp_status in ('APPROVAL_PENDING', 'APPROVED'):
            sub.status = 'trialing'
            sub.save(update_fields=['status'])
            return HttpResponseRedirect(f'{seller_settings_url}?paypal_pending=1')

        return HttpResponseRedirect(f'{seller_settings_url}?paypal_error=status_{pp_status.lower()}')


@method_decorator(csrf_exempt, name='dispatch')
class PayPalWebhookView(APIView):
    """PayPal sends subscription lifecycle events here.
    POST /api/subscriptions/paypal/webhook/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            event = json.loads(request.body)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get('event_type', '')
        resource = event.get('resource', {})
        pp_sub_id = resource.get('id') or resource.get('billing_agreement_id', '')

        if not pp_sub_id:
            return Response({'received': True})

        sub = Subscription.objects.filter(paypal_subscription_id=pp_sub_id).first()
        if not sub:
            return Response({'received': True})

        if event_type == 'BILLING.SUBSCRIPTION.ACTIVATED':
            sub.status = 'active'
            if not sub.started_at:
                sub.started_at = timezone.now()
            sub.save(update_fields=['status', 'started_at'])
            if sub.plan_tier:
                tp, _ = TenantPlan.objects.get_or_create(tenant=sub.tenant)
                tp.set_plan(sub.plan_tier)

        elif event_type in ('BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.EXPIRED'):
            sub.status = 'cancelled'
            sub.save(update_fields=['status'])

        elif event_type == 'BILLING.SUBSCRIPTION.SUSPENDED':
            sub.status = 'past_due'
            sub.save(update_fields=['status'])

        elif event_type == 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
            sub.status = 'active'
            sub.save(update_fields=['status'])

        return Response({'received': True})


class AdminSubscriptionView(APIView):
    permission_classes = [IsSuperAdmin]

    def _get_sub(self, slug):
        from tenants.models import Tenant
        try:
            tenant = Tenant.objects.get(slug=slug)
            return tenant.subscription
        except (Tenant.DoesNotExist, Subscription.DoesNotExist):
            return None

    def get(self, request, slug):
        sub = self._get_sub(slug)
        if not sub:
            return Response({'detail': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminSubscriptionSerializer(sub).data)

    def patch(self, request, slug):
        sub = self._get_sub(slug)
        if not sub:
            return Response({'detail': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminSubscriptionSerializer(sub, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)
