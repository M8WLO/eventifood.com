from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Category, Product, ProductExtra, ProductVariation
from .serializers import (
    CategorySerializer, CategorySellerSerializer,
    ProductSellerSerializer, ProductVariationSellerSerializer,
    ProductExtraSerializer,
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
