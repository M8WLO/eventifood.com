"""
POS API endpoints — used by the Eventifood POS Electron app.

GET  /api/pos/sync/          — return full catalogue (categories, products, variations, images)
POST /api/pos/orders/        — accept a single completed offline order
POST /api/pos/orders/bulk/   — accept a batch of offline orders (used by POS sync push)

Auth: no JWT/MFA required — tenant is identified by X-Tenant-Slug header.
Access control is handled at the POS device level (4-digit PIN).
"""
import decimal
import json
import uuid

from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Category, Product, ProductVariation
from orders.models import Order, OrderItem
from tenants.models import Tenant


class PosSyncView(APIView):
    """Return entire tenant catalogue in a single payload for offline sync."""
    permission_classes = [AllowAny]

    def get(self, request):
        tenant: Tenant = request.tenant
        if tenant is None:
            return Response({'error': 'Tenant not found. Pass X-Tenant-Slug header.'}, status=400)

        categories_qs = Category.objects.filter(tenant=tenant).order_by('display_order', 'name')
        products_qs = (
            Product.objects
            .filter(category__tenant=tenant, is_visible=True)
            .select_related('category')
            .prefetch_related('variations', 'extras')
        )

        categories = []
        for cat in categories_qs:
            categories.append({
                'id': cat.id,
                'name': cat.name,
                'sort_order': cat.display_order,
            })

        products = []
        variations = []
        extras = []

        for prod in products_qs:
            base_pence = int((prod.base_price or 0) * 100)
            photo_url = None
            if prod.photo:
                photo_url = request.build_absolute_uri(prod.photo.url)

            products.append({
                'id': prod.id,
                'category_id': prod.category_id,
                'name': prod.name,
                'description': prod.description or '',
                'base_price': base_pence,
                'has_variations': prod.has_variations,
                'photo_url': photo_url,
            })

            for var in prod.variations.filter(is_available=True):
                # For variation products, base_price is the variation's retail_price
                var_pence = int((var.retail_price or 0) * 100)
                variations.append({
                    'id': var.id,
                    'product_id': prod.id,
                    'name': var.name,
                    'additional_price': var_pence - base_pence,
                    'retail_price': var_pence,
                })

            for extra in prod.extras.filter(is_available=True):
                extras.append({
                    'id': extra.id,
                    'product_id': prod.id,
                    'name': extra.name,
                    'additional_price': int((extra.additional_price or 0) * 100),
                })

        return Response({
            'categories': categories,
            'products': products,
            'variations': variations,
            'extras': extras,
        })


class PosOrderView(APIView):
    """Accept a completed offline POS order and save it to the database."""
    permission_classes = [AllowAny]

    def post(self, request):
        tenant: Tenant = request.tenant
        if tenant is None:
            return Response({'error': 'Tenant not found. Pass X-Tenant-Slug header.'}, status=400)

        data = request.data

        # Generate order number (POS prefix)
        order_num = f"POS-{uuid.uuid4().hex[:8].upper()}"
        today = timezone.localdate()

        # Figure out today's daily number
        last = (
            Order.objects
            .filter(tenant=tenant, trading_date=today)
            .order_by('-daily_number')
            .values_list('daily_number', flat=True)
            .first()
        )
        daily_number = (last or 0) + 1

        total_pence = int(data.get('total_pence', 0))
        total_decimal = decimal.Decimal(total_pence) / 100

        order = Order.objects.create(
            tenant=tenant,
            order_number=order_num,
            trading_date=today,
            daily_number=daily_number,
            buyer_name=data.get('buyer_name', 'POS Customer'),
            buyer_email=data.get('buyer_email', ''),
            status='collected',
            total=total_decimal,
            notes=f"POS order. Payment: {data.get('payment_method', 'unknown')}",
        )

        items_json = data.get('items_json', '[]')
        if isinstance(items_json, str):
            items = json.loads(items_json)
        else:
            items = items_json

        for item in items:
            variation = None
            if item.get('variation_id'):
                try:
                    variation = ProductVariation.objects.get(pk=item['variation_id'])
                except ProductVariation.DoesNotExist:
                    pass

            unit_pence = int(item.get('unit_price', 0))
            qty = int(item.get('quantity', 1))
            subtotal = decimal.Decimal(unit_pence * qty) / 100

            OrderItem.objects.create(
                order=order,
                variation=variation,
                product_name=item.get('product_name', ''),
                variation_name=item.get('variation_name', '') or '',
                retail_price=decimal.Decimal(unit_pence) / 100,
                quantity=qty,
                subtotal=subtotal,
            )

        return Response({'order_number': order_num, 'daily_number': daily_number}, status=201)


def _save_pos_order(tenant, data):
    """Shared logic for saving a single POS order dict. Returns created Order."""
    order_num = f"POS-{uuid.uuid4().hex[:8].upper()}"
    today = timezone.localdate()

    last = (
        Order.objects
        .filter(tenant=tenant, trading_date=today)
        .order_by('-daily_number')
        .values_list('daily_number', flat=True)
        .first()
    )
    daily_number = (last or 0) + 1

    total_pence = int(data.get('total_pence', 0))
    total_decimal = decimal.Decimal(total_pence) / 100

    order = Order.objects.create(
        tenant=tenant,
        order_number=order_num,
        trading_date=today,
        daily_number=daily_number,
        buyer_name=data.get('buyer_name', 'POS Customer'),
        buyer_email=data.get('buyer_email', ''),
        status='collected',
        total=total_decimal,
        notes=f"POS order. Payment: {data.get('payment_method', 'unknown')}",
    )

    items_json = data.get('items_json', '[]')
    items = json.loads(items_json) if isinstance(items_json, str) else items_json

    for item in items:
        variation = None
        if item.get('variation_id'):
            try:
                variation = ProductVariation.objects.get(pk=item['variation_id'])
            except ProductVariation.DoesNotExist:
                pass

        unit_pence = int(item.get('unit_price', 0))
        qty = int(item.get('quantity', 1))
        subtotal = decimal.Decimal(unit_pence * qty) / 100

        OrderItem.objects.create(
            order=order,
            variation=variation,
            product_name=item.get('product_name', ''),
            variation_name=item.get('variation_name', '') or '',
            retail_price=decimal.Decimal(unit_pence) / 100,
            quantity=qty,
            subtotal=subtotal,
        )

    return order


class PosStatusView(APIView):
    """Return catalogue version timestamp for the POS polling check."""
    permission_classes = [AllowAny]

    def get(self, request):
        tenant: Tenant = request.tenant
        if tenant is None:
            return Response({'error': 'Tenant not found. Pass X-Tenant-Slug header.'}, status=400)

        ts = tenant.catalogue_updated_at
        return Response({
            'catalogue_updated_at': ts.isoformat() if ts else None,
        })


class PosBulkOrderView(APIView):
    """Accept a batch of offline POS orders in a single POST from the sync push."""
    permission_classes = [AllowAny]

    def post(self, request):
        tenant: Tenant = request.tenant
        if tenant is None:
            return Response({'error': 'Tenant not found. Pass X-Tenant-Slug header.'}, status=400)

        orders_data = request.data
        if not isinstance(orders_data, list):
            return Response({'error': 'Expected a JSON array of orders.'}, status=400)

        results = []
        errors = []
        for i, order_data in enumerate(orders_data):
            try:
                order = _save_pos_order(tenant, order_data)
                results.append({
                    'local_id': order_data.get('local_id'),
                    'order_number': order.order_number,
                    'daily_number': order.daily_number,
                })
            except Exception as exc:
                errors.append({'index': i, 'local_id': order_data.get('local_id'), 'error': str(exc)})

        return Response({'saved': len(results), 'errors': errors, 'results': results}, status=201)
