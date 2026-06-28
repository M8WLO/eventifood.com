from django.conf import settings
from django.db.models import Count
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Tenant
from .serializers import TenantSerializer, TenantPublicSerializer
from accounts.models import TenantMembership


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_superadmin', False))


class TenantRegistrationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TenantSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        tenant = serializer.save()

        # Generate QR code
        tenant.generate_qr_code()
        tenant.save()

        # Create membership for the registering user
        TenantMembership.objects.create(
            user=request.user,
            tenant=tenant,
            role='owner',
        )

        # In TEST_MODE provision immediately (already active by default)
        if settings.TEST_MODE:
            from subscriptions.models import Subscription
            Subscription.objects.get_or_create(
                tenant=tenant,
                defaults={'status': 'active', 'plan': 'annual'},
            )

        refresh = RefreshToken.for_user(request.user)
        return Response({
            'tenant': TenantSerializer(tenant).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class TenantDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not tenant.qr_code_svg or 'viewBox' not in tenant.qr_code_svg:
            tenant.generate_qr_code()
            tenant.save(update_fields=['qr_code_svg'])
        return Response(TenantSerializer(tenant, context={'request': request}).data)

    def patch(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Ensure the requesting user is a member
        if not tenant.members.filter(user=request.user).exists():
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = TenantSerializer(tenant, data=request.data, partial=True, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class MyTenantView(APIView):
    """Resolve the authenticated user's tenant without needing X-Tenant-Slug."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        membership = TenantMembership.objects.filter(user=request.user).select_related('tenant').first()
        if not membership:
            return Response({'detail': 'No tenant found for this user.'}, status=status.HTTP_404_NOT_FOUND)
        tenant = membership.tenant
        if not tenant.qr_code_svg or 'viewBox' not in tenant.qr_code_svg:
            tenant.generate_qr_code()
            tenant.save(update_fields=['qr_code_svg'])
        return Response(TenantSerializer(tenant, context={'request': request}).data)


class TenantPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TenantPublicSerializer(tenant, context={'request': request})
        return Response(serializer.data)


class TenantAdminListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        from orders.models import Order
        tenants = Tenant.objects.all().order_by('name')
        result = []
        for t in tenants:
            owner = TenantMembership.objects.filter(tenant=t, role='owner').select_related('user').first()
            try:
                sub = t.subscription
                sub_status = sub.status
                sub_plan = sub.plan
            except Exception:
                sub_status = None
                sub_plan = None
            result.append({
                'slug': t.slug,
                'name': t.name,
                'is_active': t.is_active,
                'created_at': t.created_at,
                'owner_email': owner.user.email if owner else None,
                'owner_name': owner.user.full_name if owner else None,
                'subscription_status': sub_status,
                'subscription_plan': sub_plan,
                'order_count': Order.objects.filter(tenant=t).count(),
            })
        return Response(result)


class TenantAdminDetailView(APIView):
    permission_classes = [IsSuperAdmin]

    def _get_tenant(self, slug):
        try:
            return Tenant.objects.get(slug=slug)
        except Tenant.DoesNotExist:
            return None

    def get(self, request, slug):
        tenant = self._get_tenant(slug)
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TenantSerializer(tenant).data)

    def patch(self, request, slug):
        tenant = self._get_tenant(slug)
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TenantSerializer(tenant, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class TenantAdminMembersView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request, slug):
        try:
            tenant = Tenant.objects.get(slug=slug)
        except Tenant.DoesNotExist:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        members = TenantMembership.objects.filter(tenant=tenant).select_related('user')
        result = []
        for m in members:
            result.append({
                'id': m.user.id,
                'email': m.user.email,
                'full_name': m.user.full_name,
                'role': m.role,
                'is_active': m.user.is_active,
                'mfa_enabled': m.user.mfa_enabled,
                'date_joined': m.user.date_joined,
            })
        return Response(result)


class TenantAdminOrdersView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request, slug):
        from orders.models import Order
        from orders.serializers import OrderSerializer
        try:
            tenant = Tenant.objects.get(slug=slug)
        except Tenant.DoesNotExist:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        orders = Order.objects.filter(tenant=tenant).order_by('-created_at')[:100]
        return Response(OrderSerializer(orders, many=True).data)
