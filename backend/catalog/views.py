from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Category, Product, ProductExtra, ProductVariation, GlobalExtra, PrintMenu
from .serializers import (
    CategorySerializer, CategorySellerSerializer,
    ProductSellerSerializer, ProductVariationSellerSerializer,
    ProductExtraSerializer, GlobalExtraSerializer, PrintMenuSerializer,
)


class MenuView(APIView):
    """Public buyer-facing menu, scoped to request.tenant."""
    permission_classes = [AllowAny]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        categories = Category.objects.filter(
            tenant=tenant,
            products__is_visible=True,
        ).prefetch_related('products__variations', 'products__extras').distinct()
        serializer = CategorySerializer(categories, many=True, context={'request': request})
        return Response(serializer.data)


class CategoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        categories = Category.objects.filter(tenant=tenant).prefetch_related('products__variations', 'products__extras')
        serializer = CategorySellerSerializer(categories, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        from .serializers import CategorySellerSerializer as CS
        serializer = CS(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(tenant=tenant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, tenant):
        return Category.objects.filter(pk=pk, tenant=tenant).first()

    def get(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(CategorySellerSerializer(obj, context={'request': request}).data)

    def patch(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySellerSerializer(obj, data=request.data, partial=True, context={'request': request})
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


class ProductListView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Enforce plan product limits
        subscription = getattr(tenant, 'subscription', None)
        plan_tier = getattr(subscription, 'plan_tier', None) if subscription else None
        if plan_tier and plan_tier.max_products is not None:
            current_count = Product.objects.filter(category__tenant=tenant).count()
            if current_count >= plan_tier.max_products:
                return Response(
                    {'detail': f'Product limit reached ({plan_tier.max_products} on {plan_tier.name} plan). Upgrade to add more.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
        serializer = ProductSellerSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        category = serializer.validated_data.get('category')
        if category.tenant != tenant:
            return Response({'detail': 'Category not found.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, tenant):
        return Product.objects.filter(pk=pk, category__tenant=tenant).first()

    def get(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSellerSerializer(obj, context={'request': request}).data)

    def patch(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ProductSellerSerializer(obj, data=request.data, partial=True, context={'request': request})
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


class ExtraView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, tenant):
        return ProductExtra.objects.filter(pk=pk, product__category__tenant=tenant).first()

    def post(self, request, product_pk):
        tenant = request.tenant
        product = Product.objects.filter(pk=product_pk, category__tenant=tenant).first()
        if not product:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ProductExtraSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ProductExtraSerializer(obj, data=request.data, partial=True)
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


class VariationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, tenant):
        return ProductVariation.objects.filter(pk=pk, product__category__tenant=tenant).first()

    def post(self, request, product_pk):
        tenant = request.tenant
        product = Product.objects.filter(pk=product_pk, category__tenant=tenant).first()
        if not product:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ProductVariationSellerSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ProductVariationSellerSerializer(obj, data=request.data, partial=True, context={'request': request})
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


class GlobalExtraListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        extras = GlobalExtra.objects.filter(tenant=tenant)
        return Response(GlobalExtraSerializer(extras, many=True, context={'request': request}).data)

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = GlobalExtraSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(tenant=tenant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GlobalExtraDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, tenant):
        return GlobalExtra.objects.filter(pk=pk, tenant=tenant).first()

    def patch(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = GlobalExtraSerializer(obj, data=request.data, partial=True, context={'request': request})
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


class PrintMenuListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        menus = PrintMenu.objects.filter(tenant=tenant)
        return Response(PrintMenuSerializer(menus, many=True).data)

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PrintMenuSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(tenant=tenant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PrintMenuDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, tenant):
        return PrintMenu.objects.filter(pk=pk, tenant=tenant).first()

    def get(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(PrintMenuSerializer(obj).data)

    def patch(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = PrintMenuSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # Enforce one default per tenant — clear the flag on all others first
        if request.data.get('is_default'):
            PrintMenu.objects.filter(tenant=request.tenant, is_default=True).exclude(pk=pk).update(is_default=False)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicMenuView(APIView):
    """Returns the fully resolved default+web-facing print menu for the storefront /menu page."""
    permission_classes = [AllowAny]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Store not found.'}, status=status.HTTP_404_NOT_FOUND)
        menu = PrintMenu.objects.filter(tenant=tenant, is_default=True, is_web_facing=True).first()
        if not menu:
            return Response({'detail': 'No public menu available.'}, status=status.HTTP_404_NOT_FOUND)

        resolved = []
        for item in menu.items:
            t, iid = item.get('type'), item.get('id')
            if t == 'product':
                obj = Product.objects.filter(pk=iid, category__tenant=tenant).first()
                if obj:
                    if not obj.qr_code_svg:
                        obj.generate_qr_code()
                        Product.objects.filter(pk=obj.pk).update(qr_code_svg=obj.qr_code_svg)
                    resolved.append({
                        'type': 'product', 'id': obj.pk,
                        'name': obj.name, 'description': obj.description,
                        'price': str(obj.base_price) if obj.base_price else None,
                        'photo': request.build_absolute_uri(obj.photo.url) if obj.photo else None,
                        'qr_code_svg': obj.qr_code_svg,
                    })
            elif t == 'variation':
                obj = ProductVariation.objects.select_related('product__category__tenant').filter(
                    pk=iid, product__category__tenant=tenant
                ).first()
                if obj:
                    if not obj.qr_code_svg:
                        obj.generate_qr_code()
                        ProductVariation.objects.filter(pk=obj.pk).update(qr_code_svg=obj.qr_code_svg)
                    resolved.append({
                        'type': 'variation', 'id': obj.pk,
                        'name': f"{obj.product.name} — {obj.name}",
                        'description': obj.product.description,
                        'price': str(obj.retail_price),
                        'photo': request.build_absolute_uri(obj.photo.url) if obj.photo else (
                            request.build_absolute_uri(obj.product.photo.url) if obj.product.photo else None
                        ),
                        'qr_code_svg': obj.qr_code_svg,
                    })
            elif t == 'global_extra':
                obj = GlobalExtra.objects.filter(pk=iid, tenant=tenant).first()
                if obj:
                    if not obj.qr_code_svg:
                        obj.generate_qr_code()
                        GlobalExtra.objects.filter(pk=obj.pk).update(qr_code_svg=obj.qr_code_svg)
                    resolved.append({
                        'type': 'global_extra', 'id': obj.pk,
                        'name': obj.name, 'description': obj.description,
                        'price': str(obj.price),
                        'photo': request.build_absolute_uri(obj.photo.url) if obj.photo else None,
                        'qr_code_svg': obj.qr_code_svg,
                    })

        return Response({
            'id': menu.pk,
            'name': menu.name,
            'items': resolved,
            'banner': request.build_absolute_uri(tenant.banner.url) if tenant.banner else None,
            'store_name': tenant.name,
            'theme': tenant.theme,
            'slug': tenant.slug,
        })


class PrintMenuRenderView(APIView):
    """Returns fully resolved item data for a print menu."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        menu = PrintMenu.objects.filter(pk=pk, tenant=tenant).first()
        if not menu:
            return Response(status=status.HTTP_404_NOT_FOUND)

        resolved = []
        for item in menu.items:
            t, iid = item.get('type'), item.get('id')
            if t == 'product':
                obj = Product.objects.filter(pk=iid, category__tenant=tenant).first()
                if obj:
                    if not obj.qr_code_svg:
                        obj.generate_qr_code()
                        Product.objects.filter(pk=obj.pk).update(qr_code_svg=obj.qr_code_svg)
                    resolved.append({
                        'type': 'product', 'id': obj.pk,
                        'name': obj.name, 'description': obj.description,
                        'price': str(obj.base_price) if obj.base_price else None,
                        'photo': request.build_absolute_uri(obj.photo.url) if obj.photo else None,
                        'qr_code_svg': obj.qr_code_svg,
                    })
            elif t == 'variation':
                obj = ProductVariation.objects.select_related('product__category__tenant').filter(pk=iid, product__category__tenant=tenant).first()
                if obj:
                    if not obj.qr_code_svg:
                        obj.generate_qr_code()
                        ProductVariation.objects.filter(pk=obj.pk).update(qr_code_svg=obj.qr_code_svg)
                    resolved.append({
                        'type': 'variation', 'id': obj.pk,
                        'name': f"{obj.product.name} — {obj.name}",
                        'description': obj.product.description,
                        'price': str(obj.retail_price),
                        'photo': request.build_absolute_uri(obj.photo.url) if obj.photo else (
                            request.build_absolute_uri(obj.product.photo.url) if obj.product.photo else None
                        ),
                        'qr_code_svg': obj.qr_code_svg,
                    })
            elif t == 'global_extra':
                obj = GlobalExtra.objects.filter(pk=iid, tenant=tenant).first()
                if obj:
                    if not obj.qr_code_svg:
                        obj.generate_qr_code()
                        GlobalExtra.objects.filter(pk=obj.pk).update(qr_code_svg=obj.qr_code_svg)
                    resolved.append({
                        'type': 'global_extra', 'id': obj.pk,
                        'name': obj.name, 'description': obj.description,
                        'price': str(obj.price),
                        'photo': request.build_absolute_uri(obj.photo.url) if obj.photo else None,
                        'qr_code_svg': obj.qr_code_svg,
                    })

        return Response({
            'id': menu.pk,
            'name': menu.name,
            'size': menu.size,
            'items': resolved,
            'banner': request.build_absolute_uri(tenant.banner.url) if tenant.banner else None,
            'store_name': tenant.name,
        })
