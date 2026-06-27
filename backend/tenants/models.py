import io
import qrcode
import qrcode.image.svg
from django.db import models


class Tenant(models.Model):
    slug = models.SlugField(unique=True, max_length=50)
    name = models.CharField(max_length=100)
    banner = models.ImageField(upload_to='banners/', null=True, blank=True)
    theme = models.CharField(max_length=20, default='default')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    qr_code_svg = models.TextField(blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.slug})"

    def generate_qr_code(self):
        """Generate SVG QR code pointing to https://{slug}.eventifood.com and store it."""
        url = f"https://{self.slug}.eventifood.com"
        factory = qrcode.image.svg.SvgImage
        img = qrcode.make(url, image_factory=factory, box_size=10)
        stream = io.BytesIO()
        img.save(stream)
        self.qr_code_svg = stream.getvalue().decode('utf-8')
