from django.urls import path
from .views import MenuView, CategoryListView, CategoryDetailView, ProductListView, ProductDetailView, VariationDetailView, ExtraView

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
]
