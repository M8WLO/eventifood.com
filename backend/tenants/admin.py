from django.contrib import admin
from .models import Tenant
from accounts.models import TenantMembership


class TenantMembershipInline(admin.TabularInline):
    model = TenantMembership
    extra = 0
    raw_id_fields = ['user']


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'theme', 'is_active', 'created_at']
    list_filter = ['is_active', 'theme']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [TenantMembershipInline]
    readonly_fields = ['qr_code_svg', 'created_at']
    actions = ['impersonate_seller']

    def impersonate_seller(self, request, queryset):
        if queryset.count() == 1:
            tenant = queryset.first()
            request.session['impersonate_tenant_id'] = tenant.id
            self.message_user(request, f"Now impersonating {tenant.name}")
        else:
            self.message_user(request, "Please select exactly one tenant to impersonate.", level='error')
    impersonate_seller.short_description = "Impersonate seller"
