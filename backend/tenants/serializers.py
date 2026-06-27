from rest_framework import serializers
from .models import Tenant
from accounts.models import TenantMembership


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'slug', 'name', 'banner', 'theme', 'is_active', 'created_at', 'qr_code_svg']
        read_only_fields = ['id', 'created_at', 'qr_code_svg']


class TenantPublicSerializer(serializers.ModelSerializer):
    """Minimal serializer for buyer-facing API."""
    class Meta:
        model = Tenant
        fields = ['name', 'banner', 'theme']
