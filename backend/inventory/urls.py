from django.urls import path
from .views import StockRecordListView, StockRecordDetailView, WastageReportView

urlpatterns = [
    path('stock/', StockRecordListView.as_view(), name='stock-list'),
    path('stock/<int:pk>/', StockRecordDetailView.as_view(), name='stock-detail'),
    path('wastage-report/', WastageReportView.as_view(), name='wastage-report'),
]
