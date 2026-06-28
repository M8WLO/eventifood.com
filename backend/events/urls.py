from django.urls import path
from .views import EventListView, EventDetailView, EventActivateView, EventPresetListView, EventPresetDetailView

urlpatterns = [
    path('', EventListView.as_view()),
    path('<int:pk>/', EventDetailView.as_view()),
    path('<int:pk>/activate/', EventActivateView.as_view()),
    path('presets/', EventPresetListView.as_view()),
    path('presets/<int:pk>/', EventPresetDetailView.as_view()),
]
