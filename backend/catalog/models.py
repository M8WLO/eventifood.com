import io
import re
import qrcode
import qrcode.image.svg
from django.db import models


def _make_qr_svg(url: str) -> str:
    """Return a scalable SVG QR code for the given URL."""
    factory = qrcode.image.svg.SvgPathImage
    img = qrcode.make(url, image_factory=factory, box_size=10)
    stream = io.BytesIO()
    img.save(stream)
    svg = stream.getvalue().decode('utf-8')
    m = re.search(r'width="(\d+)".*?height="(\d+)"', svg)
    if m:
        w, h = m.group(1), m.group(2)
        svg = re.sub(r'(<svg[^>]*?)width="\d+"', r'\1', svg)
        svg = re.sub(r'(<svg[^>]*?)height="\d+"', r'\1', svg)
        if 'viewBox' not in svg:
            svg = svg.replace('<svg ', f'<svg viewBox="0 0 {w} {h}" ', 1)
    return svg


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
    base_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    has_variations = models.BooleanField(default=False)
    photo = models.ImageField(upload_to='products/', null=True, blank=True)
    is_visible = models.BooleanField(default=True)
    out_of_stock = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    qr_code_svg = models.TextField(blank=True)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name

    @property
    def tenant(self):
        return self.category.tenant

    def generate_qr_code(self):
        slug = self.category.tenant.slug
        url = f"https://{slug}.eventifood.com/store/{slug}?add={self.pk}"
        self.qr_code_svg = _make_qr_svg(url)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.generate_qr_code()
            Product.objects.filter(pk=self.pk).update(qr_code_svg=self.qr_code_svg)


class ProductExtra(models.Model):
    """Optional add-ons that a customer can select when ordering (e.g. Extra cheese +£0.50)."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='extras')
    name = models.CharField(max_length=200)
    additional_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ['additional_price', 'name']

    def __str__(self):
        return f"{self.product.name} + {self.name} (£{self.additional_price})"


class ProductVariation(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variations')
    name = models.CharField(max_length=200)
    cost_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    retail_price = models.DecimalField(max_digits=8, decimal_places=2)
    photo = models.ImageField(upload_to='variations/', null=True, blank=True)
    is_available = models.BooleanField(default=True)
    qr_code_svg = models.TextField(blank=True)

    class Meta:
        ordering = ['retail_price']

    def __str__(self):
        return f"{self.product.name} — {self.name} (£{self.retail_price})"

    def generate_qr_code(self):
        slug = self.product.category.tenant.slug
        url = f"https://{slug}.eventifood.com/store/{slug}?add={self.product_id}&v={self.pk}"
        self.qr_code_svg = _make_qr_svg(url)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.generate_qr_code()
            ProductVariation.objects.filter(pk=self.pk).update(qr_code_svg=self.qr_code_svg)


class GlobalExtra(models.Model):
    """Tenant-level standalone orderable extra (e.g. a side dish or drink) with its own QR code."""
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='global_extras')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    photo = models.ImageField(upload_to='extras/', null=True, blank=True)
    is_available = models.BooleanField(default=True)
    qr_code_svg = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.tenant.slug} / {self.name} (£{self.price})"

    def generate_qr_code(self):
        slug = self.tenant.slug
        url = f"https://{slug}.eventifood.com/store/{slug}?extra={self.pk}"
        self.qr_code_svg = _make_qr_svg(url)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.generate_qr_code()
            GlobalExtra.objects.filter(pk=self.pk).update(qr_code_svg=self.qr_code_svg)


class PrintMenu(models.Model):
    """A saved, editable selection of items for printing as a physical menu."""
    SIZE_CHOICES = [('a4', 'A4'), ('a3', 'A3'), ('a2', 'A2')]

    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='print_menus')
    name = models.CharField(max_length=200)
    size = models.CharField(max_length=4, choices=SIZE_CHOICES, default='a4')
    # List of {"type": "product"|"variation"|"global_extra", "id": int}
    items = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.tenant.slug} / {self.name} ({self.size.upper()})"
