from decimal import Decimal
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta, date
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission

from catalog.models import ProductVariation, ProductExtra
from notifications.services import notify_order_ready, send_order_confirmation_email
from .models import Order, OrderItem, OrderItemExtra
from .serializers import PlaceOrderSerializer, OrderSerializer, OrderStatusSerializer


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_superadmin', False))


def _next_order_numbers(tenant) -> tuple[str, int]:
    """Return (order_number, daily_number) for a new order on this tenant."""
    from django.db import transaction
    with transaction.atomic():
        # Lock all rows for this tenant to prevent concurrent duplicates
        total_count = Order.objects.select_for_update().filter(tenant=tenant).count()
        order_number = f"#{(total_count + 1):04d}"
        today = timezone.now().date()
        daily_count = Order.objects.filter(tenant=tenant, created_at__date=today).count()
        daily_number = daily_count + 1
    return order_number, daily_number


class PlaceOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PlaceOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        items_data = data.pop('items')

        # Resolve variations and calculate total
        order_items = []
        total = Decimal('0.00')

        for item_data in items_data:
            try:
                variation = ProductVariation.objects.select_related(
                    'product__category__tenant'
                ).get(pk=item_data['variation_id'], product__category__tenant=tenant)
            except ProductVariation.DoesNotExist:
                return Response(
                    {'detail': f"Variation {item_data['variation_id']} not found."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Resolve extras
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
            qty = item_data['quantity']
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

        order_number, daily_number = _next_order_numbers(tenant)
        order = Order.objects.create(
            tenant=tenant,
            order_number=order_number,
            daily_number=daily_number,
            total=total,
            **data,
        )

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

        send_order_confirmation_email(order)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_number):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        order = Order.objects.filter(tenant=tenant, order_number=order_number).first()
        if not order:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderStatusSerializer(order).data)


class SellerOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        qs = Order.objects.filter(tenant=tenant).prefetch_related('items')
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if request.query_params.get('board') == 'true':
            qs = qs.filter(status__in=['placed', 'preparing', 'ready'])
        return Response(OrderSerializer(qs, many=True).data)


class UpdateOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        order = Order.objects.filter(pk=pk, tenant=tenant).first()
        if not order:
            return Response(status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        old_status = order.status
        order.status = new_status
        order.save()
        if old_status != 'ready' and new_status == 'ready':
            notify_order_ready(order)
        return Response(OrderSerializer(order).data)


class PlatformStatsView(APIView):
    """Superadmin only: total order counts across all tenants."""
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        today = timezone.now().date()
        week_start = today - timedelta(days=6)
        year_start = today.replace(month=1, day=1)
        all_orders = Order.objects.all()
        return Response({
            'today':     all_orders.filter(created_at__date=today).count(),
            'this_week': all_orders.filter(created_at__date__gte=week_start).count(),
            'this_year': all_orders.filter(created_at__date__gte=year_start).count(),
            'all_time':  all_orders.count(),
        })


class SalesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)

        period = request.query_params.get('period', 'today')
        today = timezone.now().date()

        if period == 'today':
            date_from = today
            date_to = today
        elif period == 'week':
            date_from = today - timedelta(days=7)
            date_to = today
        elif period == 'month':
            date_from = today.replace(day=1)
            date_to = today
        else:
            try:
                date_from = date.fromisoformat(request.query_params.get('date_from', str(today)))
                date_to = date.fromisoformat(request.query_params.get('date_to', str(today)))
            except ValueError:
                return Response({'detail': 'Invalid date format.'}, status=status.HTTP_400_BAD_REQUEST)

        orders = Order.objects.filter(
            tenant=tenant,
            created_at__date__gte=date_from,
            created_at__date__lte=date_to,
        )

        agg = orders.aggregate(
            total_orders=Count('id'),
            total_revenue=Sum('total'),
        )

        # Revenue by category
        from catalog.models import Category
        revenue_by_category = []
        for cat in Category.objects.filter(tenant=tenant):
            cat_revenue = OrderItem.objects.filter(
                order__in=orders,
                variation__product__category=cat,
            ).aggregate(revenue=Sum('subtotal'))['revenue'] or Decimal('0.00')
            if cat_revenue > 0:
                revenue_by_category.append({'category': cat.name, 'revenue': str(cat_revenue)})

        # Top products
        top_products = (
            OrderItem.objects.filter(order__in=orders)
            .values('product_name')
            .annotate(total_qty=Sum('quantity'), total_revenue=Sum('subtotal'))
            .order_by('-total_revenue')[:10]
        )

        # Wastage cost
        from inventory.models import StockRecord
        wastage = StockRecord.objects.filter(
            product__category__tenant=tenant,
            date__gte=date_from,
            date__lte=date_to,
        ).aggregate(total_wastage=Sum('wastage_cost'))

        total_revenue = agg['total_revenue'] or Decimal('0.00')
        total_wastage_cost = wastage['total_wastage'] or Decimal('0.00')

        total_cost = OrderItem.objects.filter(order__in=orders).aggregate(
            tc=Sum(F('cost_price') * F('quantity'))
        )['tc'] or Decimal('0.00')

        gross_profit = total_revenue - total_wastage_cost - total_cost

        return Response({
            'date_from': str(date_from),
            'date_to': str(date_to),
            'total_orders': agg['total_orders'] or 0,
            'total_revenue': str(total_revenue),
            'total_wastage_cost': str(total_wastage_cost),
            'total_cost_price': str(total_cost),
            'gross_profit': str(gross_profit),
            'revenue_by_category': revenue_by_category,
            'top_products': list(top_products),
        })
