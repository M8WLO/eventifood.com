from django.db import models


class StockRecord(models.Model):
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='stock_records')
    date = models.DateField()
    starting_qty = models.PositiveIntegerField(null=True, blank=True)
    wastage_qty = models.PositiveIntegerField(default=0)
    wastage_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('product', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.product.name} on {self.date} (wastage: {self.wastage_qty})"
