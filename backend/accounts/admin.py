from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, TenantMembership, EmailOTP


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'is_active', 'is_staff', 'is_superadmin', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'is_superadmin', 'mfa_enabled']
    search_fields = ['email', 'full_name']
    ordering = ['email']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_superadmin', 'mfa_enabled', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('date_joined', 'last_login')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'password1', 'password2'),
        }),
    )
    readonly_fields = ['date_joined', 'last_login']


@admin.register(TenantMembership)
class TenantMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'tenant', 'role']
    list_filter = ['role']
    raw_id_fields = ['user', 'tenant']


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ['user', 'code', 'created_at', 'expires_at', 'is_used']
    list_filter = ['is_used']
    raw_id_fields = ['user']
    readonly_fields = ['created_at']
