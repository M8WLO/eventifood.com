from django.urls import path
from .views import StockRecordListView, StockRecordDetailView, StockTodayView, WastageReportView

urlpatterns = [
    path('stock/', StockRecordListView.as_view(), name='stock-list'),
    path('stock/today/', StockTodayView.as_view(), name='stock-today'),
    path('stock/<int:pk>/', StockRecordDetailView.as_view(), name='stock-detail'),
    path('wastage-report/', WastageReportView.as_view(), name='wastage-report'),
]
