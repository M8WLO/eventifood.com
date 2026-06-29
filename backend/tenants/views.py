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
                'trial_expires_at': t.trial_expires_at,
                'is_service_live': t.is_service_live(),
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

    def delete(self, request, slug):
        tenant = self._get_tenant(slug)
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        confirm = request.data.get('confirm_name', '')
        if confirm != tenant.name:
            return Response(
                {'detail': 'Confirmation name does not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Capture owner before cascade deletes the membership
        owner_membership = TenantMembership.objects.filter(tenant=tenant, role='owner').select_related('user').first()
        owner_user = owner_membership.user if owner_membership else None

        tenant.delete()  # cascades TenantMembership

        # Delete owner user only if they have no remaining memberships
        if owner_user and not TenantMembership.objects.filter(user=owner_user).exists():
            owner_user.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


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


class TenantCopyView(APIView):
    """Copy all catalog, settings and orders from one tenant to another."""
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        import os, shutil
        from django.db import transaction
        from django.conf import settings as django_settings
        from accounts.models import User
        from catalog.models import Category, Product, ProductVariation, ProductExtra, GlobalExtra
        from orders.models import Order, OrderItem, OrderItemExtra

        from_email = request.data.get('from_email', '').strip()
        to_email   = request.data.get('to_email', '').strip()
        copy_orders = request.data.get('copy_orders', True)

        try:
            src_user = User.objects.get(email=from_email)
        except User.DoesNotExist:
            return Response({'detail': f'Source user not found: {from_email}'}, status=status.HTTP_404_NOT_FOUND)
        try:
            dst_user = User.objects.get(email=to_email)
        except User.DoesNotExist:
            return Response({'detail': f'Destination user not found: {to_email}'}, status=status.HTTP_404_NOT_FOUND)

        src_m = TenantMembership.objects.filter(user=src_user, role='owner').select_related('tenant').first()
        dst_m = TenantMembership.objects.filter(user=dst_user, role='owner').select_related('tenant').first()

        if not src_m:
            return Response({'detail': f'No tenant for source user.'}, status=status.HTTP_404_NOT_FOUND)
        if not dst_m:
            return Response({'detail': f'No tenant for destination user.'}, status=status.HTTP_404_NOT_FOUND)

        src = src_m.tenant
        dst = dst_m.tenant

        def copy_media(src_name, subdir):
            """Copy a media file to a new path; return the new relative path."""
            if not src_name:
                return ''
            src_path = os.path.join(django_settings.MEDIA_ROOT, str(src_name))
            if not os.path.exists(src_path):
                return str(src_name)
            ext = os.path.splitext(src_path)[1]
            import uuid
            new_name = f"{subdir}/{uuid.uuid4().hex}{ext}"
            dst_path = os.path.join(django_settings.MEDIA_ROOT, new_name)
            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            shutil.copy2(src_path, dst_path)
            return new_name

        stats = {'categories': 0, 'products': 0, 'variations': 0, 'global_extras': 0, 'orders': 0}

        with transaction.atomic():
            # --- Subscription + Plan ---
            from subscriptions.models import Subscription, TenantPlan
            try:
                src_sub = src.subscription
                dst_sub, _ = Subscription.objects.get_or_create(tenant=dst, defaults={'status': 'trialing'})
                dst_sub.plan = src_sub.plan
                dst_sub.plan_tier = src_sub.plan_tier
                dst_sub.status = src_sub.status
                dst_sub.annual_cost = src_sub.annual_cost
                dst_sub.started_at = src_sub.started_at
                dst_sub.next_billing_date = src_sub.next_billing_date
                dst_sub.save()
                if src_sub.plan_tier:
                    dst_tp, _ = TenantPlan.objects.get_or_create(tenant=dst)
                    dst_tp.set_plan(src_sub.plan_tier, user=request.user)
            except Subscription.DoesNotExist:
                pass

            # --- Settings ---
            dst.theme = src.theme
            dst.order_number_mode = src.order_number_mode
            dst.wait_time_enabled = src.wait_time_enabled
            dst.kitchen_nav_items = src.kitchen_nav_items
            if src.banner:
                dst.banner = copy_media(src.banner.name, 'banners')
            dst.save()

            # --- Categories ---
            cat_map = {}
            dst.categories.all().delete()
            for cat in src.categories.all().order_by('display_order'):
                new_cat = Category.objects.create(
                    tenant=dst,
                    name=cat.name,
                    display_order=cat.display_order,
                )
                cat_map[cat.id] = new_cat
                stats['categories'] += 1

            # --- Products + Variations + Extras ---
            # Note: dst categories were deleted above which cascades to their products.
            var_map = {}
            for prod in Product.objects.filter(category__tenant=src).order_by('display_order').prefetch_related('variations', 'extras'):
                new_photo = copy_media(prod.photo.name if prod.photo else '', 'products')
                new_prod = Product.objects.create(
                    category=cat_map.get(prod.category_id),
                    name=prod.name,
                    description=prod.description,
                    base_price=prod.base_price,
                    has_variations=prod.has_variations,
                    photo=new_photo or None,
                    is_visible=prod.is_visible,
                    out_of_stock=prod.out_of_stock,
                    display_order=prod.display_order,
                    prep_time_minutes=prod.prep_time_minutes,
                )
                stats['products'] += 1

                for var in prod.variations.all():
                    new_vphoto = copy_media(var.photo.name if var.photo else '', 'variations')
                    new_var = ProductVariation.objects.create(
                        product=new_prod,
                        name=var.name,
                        cost_price=var.cost_price,
                        retail_price=var.retail_price,
                        photo=new_vphoto or None,
                        is_available=var.is_available,
                    )
                    var_map[var.id] = new_var
                    stats['variations'] += 1

                for extra in prod.extras.all():
                    ProductExtra.objects.create(
                        product=new_prod,
                        name=extra.name,
                        additional_price=extra.additional_price,
                        is_available=extra.is_available,
                    )

            # --- Global Extras ---
            dst.global_extras.all().delete()
            for ge in src.global_extras.all().order_by('display_order'):
                new_ge_photo = copy_media(ge.photo.name if ge.photo else '', 'extras')
                GlobalExtra.objects.create(
                    tenant=dst,
                    name=ge.name,
                    description=ge.description,
                    price=ge.price,
                    photo=new_ge_photo or None,
                    is_available=ge.is_available,
                    display_order=ge.display_order,
                )

            # --- Orders ---
            if copy_orders:
                Order.objects.filter(tenant=dst).delete()
                for order in Order.objects.filter(tenant=src).prefetch_related('items__extras'):
                    new_order = Order.objects.create(
                        tenant=dst,
                        order_number=order.order_number,
                        trading_date=order.trading_date,
                        daily_number=order.daily_number,
                        buyer_name=order.buyer_name,
                        buyer_email=order.buyer_email,
                        buyer_phone=order.buyer_phone,
                        status=order.status,
                        total=order.total,
                        notes=order.notes,
                        discount_code=order.discount_code,
                        discount_amount=order.discount_amount,
                        ready_at=order.ready_at,
                    )
                    # Preserve original timestamps via update
                    Order.objects.filter(pk=new_order.pk).update(
                        created_at=order.created_at,
                        updated_at=order.updated_at,
                    )
                    for item in order.items.all():
                        new_item = OrderItem.objects.create(
                            order=new_order,
                            variation=var_map.get(item.variation_id),
                            product_name=item.product_name,
                            variation_name=item.variation_name,
                            retail_price=item.retail_price,
                            cost_price=item.cost_price,
                            quantity=item.quantity,
                            subtotal=item.subtotal,
                        )
                        for extra in item.extras.all():
                            OrderItemExtra.objects.create(
                                order_item=new_item,
                                extra=extra.extra,
                                name=extra.name,
                                additional_price=extra.additional_price,
                            )
                    stats['orders'] += 1

        return Response({
            'detail': f"Copied from '{src.slug}' to '{dst.slug}' successfully.",
            'stats': stats,
        })
