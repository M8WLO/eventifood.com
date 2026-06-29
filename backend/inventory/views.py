import datetime
from django.db.models import Sum
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from catalog.models import Product
from .models import StockRecord
from .serializers import StockRecordSerializer


class StockRecordListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        records = StockRecord.objects.filter(product__category__tenant=tenant).select_related('product')
        serializer = StockRecordSerializer(records, many=True)
        return Response(serializer.data)

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = StockRecordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        product = serializer.validated_data['product']
        if product.category.tenant != tenant:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StockRecordDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, tenant):
        return StockRecord.objects.filter(pk=pk, product__category__tenant=tenant).first()

    def get(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(StockRecordSerializer(obj).data)

    def patch(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = StockRecordSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StockTodayView(APIView):
    """Returns all products for the tenant with their stock record for the given date (default: today).
    Creates an empty StockRecord (get_or_create) for any product that doesn't have one yet.
    Accepts optional ?date=YYYY-MM-DD query param."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        date_param = request.query_params.get('date')
        if date_param:
            try:
                today = datetime.date.fromisoformat(date_param)
            except ValueError:
                return Response({'detail': 'Invalid date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            today = datetime.date.today()
        products = Product.objects.filter(category__tenant=tenant).select_related('category').order_by('category__display_order', 'display_order')
        result = []
        for product in products:
            record, _ = StockRecord.objects.get_or_create(product=product, date=today)
            result.append({
                'id': record.pk,
                'product': product.pk,
                'product_name': product.name,
                'date': str(today),
                'starting_qty': record.starting_qty,
                'wastage_qty': record.wastage_qty,
                'wastage_cost': str(record.wastage_cost),
                'notes': record.notes,
            })
        return Response(result)


class StockLastBeforeView(APIView):
    """Returns the most recent date before `date` that has any non-null starting_qty,
    plus all product quantities for that date. Used to pre-fill a new day from the last recorded session."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        date_param = request.query_params.get('date')
        if not date_param:
            return Response({'detail': 'date parameter required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            ref_date = datetime.date.fromisoformat(date_param)
        except ValueError:
            return Response({'detail': 'Invalid date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        last = (
            StockRecord.objects
            .filter(product__category__tenant=tenant, date__lt=ref_date, starting_qty__isnull=False)
            .order_by('-date')
            .values('date')
            .first()
        )
        if not last:
            return Response({'date': None, 'records': []})

        last_date = last['date']
        records = (
            StockRecord.objects
            .filter(product__category__tenant=tenant, date=last_date, starting_qty__isnull=False)
            .select_related('product')
        )
        return Response({
            'date': str(last_date),
            'records': [{'product': r.product_id, 'starting_qty': r.starting_qty} for r in records],
        })


class WastageReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        qs = StockRecord.objects.filter(product__category__tenant=tenant)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        from django.db.models import Sum
        totals = qs.values('product__name').annotate(
            total_wastage_qty=Sum('wastage_qty'),
            total_wastage_cost=Sum('wastage_cost'),
        ).order_by('-total_wastage_cost')
        return Response(list(totals))
