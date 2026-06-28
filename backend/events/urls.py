from django.urls import path
from .views import EventListView, EventDetailView, EventActivateView

urlpatterns = [
    path('', EventListView.as_view()),
    path('<int:pk>/', EventDetailView.as_view()),
    path('<int:pk>/activate/', EventActivateView.as_view()),
]
