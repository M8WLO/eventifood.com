from django.db import models


class TenantSnapshot(models.Model):
    tenant = models.ForeignKey(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='snapshots'
    )
    name = models.CharField(max_length=200)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    snapshot_data = models.JSONField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.tenant.slug} — {self.name} ({self.created_at:%Y-%m-%d %H:%M})'
