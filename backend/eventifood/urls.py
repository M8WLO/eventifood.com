from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from django.http import JsonResponse


def health(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health),
    path('api/auth/', include('accounts.urls')),
    path('api/tenants/', include('tenants.urls')),
    path('api/catalog/', include('catalog.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/payments/', include('payments.urls')),
    # Serve media files in all environments (gunicorn handles this; no Nginx in Railway)
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
