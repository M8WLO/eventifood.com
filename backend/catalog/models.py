from django.db import models


class Category(models.Model):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name_plural = 'categories'

    def __str__(self):
        return f"{self.tenant.slug} / {self.name}"


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to='products/', null=True, blank=True)
    is_visible = models.BooleanField(default=True)
    out_of_stock = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name

    @property
    def tenant(self):
        return self.category.tenant


class ProductVariation(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variations')
    name = models.CharField(max_length=200)
    cost_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    retail_price = models.DecimalField(max_digits=8, decimal_places=2)
    photo = models.ImageField(upload_to='variations/', null=True, blank=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ['retail_price']

    def __str__(self):
        return f"{self.product.name} — {self.name} (£{self.retail_price})"
