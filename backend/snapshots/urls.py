from django.urls import path
from . import views

urlpatterns = [
    path('<str:tenant_slug>/', views.SnapshotListCreateView.as_view()),
    path('<str:tenant_slug>/<int:snapshot_id>/restore/', views.SnapshotRestoreView.as_view()),
    path('<str:tenant_slug>/<int:snapshot_id>/', views.SnapshotDeleteView.as_view()),
]
