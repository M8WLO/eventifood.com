from django.db import models


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('placed', 'Placed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('collected', 'Collected'),
    ]
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=20)
    # trading_date: the calendar date the order belongs to (set at placement, survives midnight crossovers)
    trading_date = models.DateField(null=True, blank=True)
    daily_number = models.PositiveIntegerField(null=True, blank=True)
    buyer_name = models.CharField(max_length=100)
    buyer_email = models.EmailField()
    buyer_phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='placed')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)
    stripe_session_id = models.CharField(max_length=200, blank=True, default='')
    discount_code = models.CharField(max_length=50, blank=True, default='')
    discount_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ready_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [
            ('tenant', 'order_number'),
            ('tenant', 'trading_date', 'daily_number'),  # prevents duplicate daily numbers per day
        ]

    def __str__(self):
        return f"Order {self.order_number} @ {self.tenant.slug} ({self.status})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variation = models.ForeignKey('catalog.ProductVariation', on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=200)
    variation_name = models.CharField(max_length=200)
    retail_price = models.DecimalField(max_digits=8, decimal_places=2)
    cost_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.quantity}x {self.product_name} ({self.variation_name})"


class OrderItemExtra(models.Model):
    """Snapshotted extra/add-on chosen by the customer at order time."""
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='extras')
    extra = models.ForeignKey('catalog.ProductExtra', on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200)
    additional_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name} (+£{self.additional_price})"
