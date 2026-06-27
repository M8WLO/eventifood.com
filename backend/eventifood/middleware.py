from tenants.models import Tenant


class TenantMiddleware:
    """
    Reads X-Tenant-Slug header and attaches the matching Tenant
    to request.tenant. Sets request.tenant = None if not found.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        slug = request.META.get('HTTP_X_TENANT_SLUG', '').strip()
        if slug:
            request.tenant = Tenant.objects.filter(slug=slug, is_active=True).first()
        else:
            request.tenant = None
        response = self.get_response(request)
        return response
