from django.urls import path
from .views import (
    MenuView, CategoryListView, CategoryDetailView,
    ProductListView, ProductDetailView, VariationDetailView, ExtraView,
    GlobalExtraListView, GlobalExtraDetailView,
    PrintMenuListView, PrintMenuDetailView, PrintMenuRenderView,
)

urlpatterns = [
    path('menu/', MenuView.as_view(), name='menu'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:product_pk>/variations/', VariationDetailView.as_view(), name='variation-create'),
    path('variations/<int:pk>/', VariationDetailView.as_view(), name='variation-detail'),
    path('products/<int:product_pk>/extras/', ExtraView.as_view(), name='extra-create'),
    path('extras/<int:pk>/', ExtraView.as_view(), name='extra-detail'),
    path('global-extras/', GlobalExtraListView.as_view(), name='global-extra-list'),
    path('global-extras/<int:pk>/', GlobalExtraDetailView.as_view(), name='global-extra-detail'),
    path('print-menus/', PrintMenuListView.as_view(), name='print-menu-list'),
    path('print-menus/<int:pk>/', PrintMenuDetailView.as_view(), name='print-menu-detail'),
    path('print-menus/<int:pk>/render/', PrintMenuRenderView.as_view(), name='print-menu-render'),
]
