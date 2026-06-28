from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import DiscountCode
from .serializers import DiscountCodeSerializer

MAX_CODES = 20


def _has_discounts_feature(tenant):
    try:
        flags = tenant.tenant_plan.plan.feature_flags or []
        return 'discounts' in flags
    except Exception:
        return False


class DiscountCodeListView(APIView):
    """List and create discount codes for the seller's tenant."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not _has_discounts_feature(tenant):
            return Response({'detail': 'Discount codes are not available on your plan.'}, status=status.HTTP_403_FORBIDDEN)
        codes = DiscountCode.objects.filter(tenant=tenant)
        return Response(DiscountCodeSerializer(codes, many=True).data)

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not _has_discounts_feature(tenant):
            return Response({'detail': 'Discount codes are not available on your plan.'}, status=status.HTTP_403_FORBIDDEN)
        count = DiscountCode.objects.filter(tenant=tenant).count()
        if count >= MAX_CODES:
            return Response(
                {'detail': f'You have reached the limit of {MAX_CODES} discount codes.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = DiscountCodeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        code = serializer.validated_data['code']
        if DiscountCode.objects.filter(tenant=tenant, code=code).exists():
            return Response({'detail': 'A code with this name already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        instance = serializer.save(tenant=tenant)
        return Response(DiscountCodeSerializer(instance).data, status=status.HTTP_201_CREATED)


class DiscountCodeDetailView(APIView):
    """Update or delete a single discount code."""
    permission_classes = [IsAuthenticated]

    def _get_code(self, request, pk):
        tenant = request.tenant
        if not tenant:
            return None, Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not _has_discounts_feature(tenant):
            return None, Response({'detail': 'Discount codes are not available on your plan.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            return DiscountCode.objects.get(pk=pk, tenant=tenant), None
        except DiscountCode.DoesNotExist:
            return None, Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        code_obj, err = self._get_code(request, pk)
        if err:
            return err
        serializer = DiscountCodeSerializer(code_obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # If changing the code text, check uniqueness
        new_code = serializer.validated_data.get('code')
        if new_code and new_code != code_obj.code:
            if DiscountCode.objects.filter(tenant=request.tenant, code=new_code).exists():
                return Response({'detail': 'A code with this name already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        instance = serializer.save()
        return Response(DiscountCodeSerializer(instance).data)

    def delete(self, request, pk):
        code_obj, err = self._get_code(request, pk)
        if err:
            return err
        code_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ValidateDiscountView(APIView):
    """Public endpoint: validate a discount code for the current tenant and return discount details."""
    permission_classes = [AllowAny]

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'valid': False, 'detail': 'Store not found.'})
        if not _has_discounts_feature(tenant):
            return Response({'valid': False, 'detail': 'This store does not accept discount codes.'})

        raw_code = request.data.get('code', '').upper().strip()
        if not raw_code:
            return Response({'valid': False, 'detail': 'No code provided.'})

        try:
            raw_total = Decimal(str(request.data.get('total', '0')))
        except Exception:
            raw_total = Decimal('0')

        try:
            dc = DiscountCode.objects.get(tenant=tenant, code=raw_code)
        except DiscountCode.DoesNotExist:
            return Response({'valid': False, 'detail': 'Invalid discount code.'})

        if not dc.is_valid():
            return Response({'valid': False, 'detail': 'This discount code is expired or no longer valid.'})

        if dc.discount_type == 'percentage':
            amount = (raw_total * dc.discount_value / 100).quantize(Decimal('0.01'))
        else:
            amount = min(dc.discount_value, raw_total)

        return Response({
            'valid': True,
            'code': dc.code,
            'discount_type': dc.discount_type,
            'discount_value': str(dc.discount_value),
            'discount_amount': str(amount),
        })
