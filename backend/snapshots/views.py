import os
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Category, GlobalExtra, Product, ProductExtra, ProductVariation
from tenants.models import Tenant
from .models import TenantSnapshot
from .serializers import TenantSnapshotSerializer


class IsSuperAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and getattr(request.user, 'is_superadmin', False)


def _media_exists(relative_path):
    if not relative_path:
        return False
    return os.path.exists(os.path.join(settings.MEDIA_ROOT, relative_path))


def _capture_catalog(tenant):
    """Return a JSON-serialisable dict representing the full tenant catalog."""
    categories = []
    for cat in Category.objects.filter(tenant=tenant).prefetch_related(
        'products__extras', 'products__variations'
    ):
        products = []
        for p in cat.products.all():
            extras = [
                {
                    'name': e.name,
                    'additional_price': str(e.additional_price),
                    'is_available': e.is_available,
                }
                for e in p.extras.all()
            ]
            variations = [
                {
                    'name': v.name,
                    'retail_price': str(v.retail_price),
                    'cost_price': str(v.cost_price) if v.cost_price is not None else None,
                    'photo': v.photo.name if v.photo else None,
                    'is_available': v.is_available,
                }
                for v in p.variations.all()
            ]
            products.append({
                'name': p.name,
                'description': p.description,
                'base_price': str(p.base_price) if p.base_price is not None else None,
                'has_variations': p.has_variations,
                'photo': p.photo.name if p.photo else None,
                'is_visible': p.is_visible,
                'out_of_stock': p.out_of_stock,
                'display_order': p.display_order,
                'prep_time_minutes': p.prep_time_minutes,
                'extras': extras,
                'variations': variations,
            })
        categories.append({
            'name': cat.name,
            'display_order': cat.display_order,
            'products': products,
        })

    global_extras = [
        {
            'name': ge.name,
            'description': ge.description,
            'price': str(ge.price),
            'photo': ge.photo.name if ge.photo else None,
            'is_available': ge.is_available,
            'display_order': ge.display_order,
        }
        for ge in GlobalExtra.objects.filter(tenant=tenant)
    ]

    return {'categories': categories, 'global_extras': global_extras}


def _restore_catalog(tenant, data):
    """Delete all existing catalog data for tenant and recreate from snapshot dict."""
    Category.objects.filter(tenant=tenant).delete()
    GlobalExtra.objects.filter(tenant=tenant).delete()

    for cat_data in data.get('categories', []):
        cat = Category.objects.create(
            tenant=tenant,
            name=cat_data['name'],
            display_order=cat_data.get('display_order', 0),
        )
        for p_data in cat_data.get('products', []):
            product = Product(
                category=cat,
                name=p_data['name'],
                description=p_data.get('description', ''),
                base_price=p_data.get('base_price'),
                has_variations=p_data.get('has_variations', False),
                is_visible=p_data.get('is_visible', True),
                out_of_stock=p_data.get('out_of_stock', False),
                display_order=p_data.get('display_order', 0),
                prep_time_minutes=p_data.get('prep_time_minutes'),
            )
            photo_path = p_data.get('photo')
            if photo_path and _media_exists(photo_path):
                product.photo.name = photo_path
            product.save()

            for e_data in p_data.get('extras', []):
                ProductExtra.objects.create(
                    product=product,
                    name=e_data['name'],
                    additional_price=e_data.get('additional_price', 0),
                    is_available=e_data.get('is_available', True),
                )

            for v_data in p_data.get('variations', []):
                v = ProductVariation(
                    product=product,
                    name=v_data['name'],
                    retail_price=v_data['retail_price'],
                    cost_price=v_data.get('cost_price'),
                    is_available=v_data.get('is_available', True),
                )
                v_photo = v_data.get('photo')
                if v_photo and _media_exists(v_photo):
                    v.photo.name = v_photo
                v.save()

    for ge_data in data.get('global_extras', []):
        ge = GlobalExtra(
            tenant=tenant,
            name=ge_data['name'],
            description=ge_data.get('description', ''),
            price=ge_data['price'],
            is_available=ge_data.get('is_available', True),
            display_order=ge_data.get('display_order', 0),
        )
        ge_photo = ge_data.get('photo')
        if ge_photo and _media_exists(ge_photo):
            ge.photo.name = ge_photo
        ge.save()


class SnapshotListCreateView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request, tenant_slug):
        tenant = _get_tenant_or_404(tenant_slug)
        snapshots = TenantSnapshot.objects.filter(tenant=tenant)
        return Response({
            'tenant_slug': tenant.slug,
            'tenant_name': tenant.name,
            'snapshots': TenantSnapshotSerializer(snapshots, many=True).data,
        })

    def post(self, request, tenant_slug):
        tenant = _get_tenant_or_404(tenant_slug)
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'error': 'name is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Auto-tag with slug so every snapshot is identifiable without context
        prefix = f'{tenant.slug} — '
        if not name.startswith(prefix):
            name = prefix + name

        snapshot_data = _capture_catalog(tenant)
        snap = TenantSnapshot.objects.create(
            tenant=tenant,
            name=name,
            notes=request.data.get('notes', ''),
            created_by=request.user,
            snapshot_data=snapshot_data,
        )
        return Response(TenantSnapshotSerializer(snap).data, status=status.HTTP_201_CREATED)


class SnapshotRestoreView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, tenant_slug, snapshot_id):
        tenant = _get_tenant_or_404(tenant_slug)
        try:
            snap = TenantSnapshot.objects.get(pk=snapshot_id, tenant=tenant)
        except TenantSnapshot.DoesNotExist:
            return Response({'error': 'Snapshot not found'}, status=status.HTTP_404_NOT_FOUND)

        _restore_catalog(tenant, snap.snapshot_data)
        return Response({'restored': True, 'snapshot': TenantSnapshotSerializer(snap).data})


class SnapshotDeleteView(APIView):
    permission_classes = [IsSuperAdmin]

    def delete(self, request, tenant_slug, snapshot_id):
        tenant = _get_tenant_or_404(tenant_slug)
        try:
            snap = TenantSnapshot.objects.get(pk=snapshot_id, tenant=tenant)
        except TenantSnapshot.DoesNotExist:
            return Response({'error': 'Snapshot not found'}, status=status.HTTP_404_NOT_FOUND)

        snap.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _get_tenant_or_404(slug):
    try:
        return Tenant.objects.get(slug=slug)
    except Tenant.DoesNotExist:
        from rest_framework.exceptions import NotFound
        raise NotFound(f'Tenant "{slug}" not found')
