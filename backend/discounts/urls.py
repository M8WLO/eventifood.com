from django.urls import path
from . import views

urlpatterns = [
    path('', views.DiscountCodeListView.as_view()),
    path('validate/', views.ValidateDiscountView.as_view()),
    path('<int:pk>/', views.DiscountCodeDetailView.as_view()),
]
