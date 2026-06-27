from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Tenant
from .serializers import TenantSerializer, TenantPublicSerializer
from accounts.models import TenantMembership


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
        return Response(TenantSerializer(tenant).data)

    def patch(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Ensure the requesting user is a member
        if not tenant.members.filter(user=request.user).exists():
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = TenantSerializer(tenant, data=request.data, partial=True)
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
        return Response(TenantSerializer(tenant).data)


class TenantPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TenantPublicSerializer(tenant)
        return Response(serializer.data)
