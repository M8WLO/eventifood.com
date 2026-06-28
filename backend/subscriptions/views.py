import json
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission

from .models import Subscription, Plan, TenantPlan
from .serializers import SubscriptionSerializer, PlanSerializer, AdminSubscriptionSerializer, TenantPlanSerializer


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
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
        serializer.save()
        return Response(serializer.data)

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
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
