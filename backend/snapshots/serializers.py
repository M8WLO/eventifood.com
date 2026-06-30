from rest_framework import serializers
from .models import TenantSnapshot


class TenantSnapshotSerializer(serializers.ModelSerializer):
    created_by_email = serializers.SerializerMethodField()

    class Meta:
        model = TenantSnapshot
        fields = ['id', 'name', 'notes', 'created_at', 'created_by_email']

    def get_created_by_email(self, obj):
        return obj.created_by.email if obj.created_by else None
