import io
import qrcode
import qrcode.image.svg
from django.db import models


class Promotion(models.Model):
    name = models.CharField(max_length=100)
    banner_headline = models.CharField(max_length=200)
    banner_subtext = models.CharField(max_length=400)
    banner_cta = models.CharField(max_length=80, default='Claim free months →')
    start_date = models.DateField()
    end_date = models.DateField()
    trial_until = models.DateField()
    plan = models.ForeignKey(
        'subscriptions.Plan',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='promotions',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return self.name

    @classmethod
    def get_active(cls):
        from datetime import date
        today = date.today()
        return cls.objects.filter(
            is_active=True,
            end_date__gte=today,
        ).first()


class Tenant(models.Model):
    slug = models.SlugField(unique=True, max_length=50)
    name = models.CharField(max_length=100)
    banner = models.ImageField(upload_to='banners/', null=True, blank=True)
    theme = models.CharField(max_length=20, default='default')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    qr_code_svg = models.TextField(blank=True)
    kitchen_nav_items = models.JSONField(default=list, blank=True)
    order_number_mode = models.CharField(
        max_length=10,
        choices=[('daily', 'Daily (resets each day)'), ('total', 'Total (cumulative)')],
        default='daily',
    )
    payment_mode = models.CharField(
        max_length=10,
        choices=[('payg', 'Pay As You Go (platform 2%)'), ('own', 'Own payment methods')],
        default='payg',
    )
    wait_time_enabled = models.BooleanField(default=False)
    is_demo = models.BooleanField(default=False)
    trial_expires_at = models.DateField(null=True, blank=True)
    account_number = models.CharField(max_length=20, unique=True, blank=True, default='')
    show_event_menu_name = models.BooleanField(default=False)
    july_giveaway = models.BooleanField(default=False)
    catalogue_updated_at = models.DateTimeField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.slug})"

    def is_service_live(self) -> bool:
        """Return True if this tenant's store should accept orders."""
        from django.utils import timezone
        if not self.trial_expires_at:
            return True
        if self.trial_expires_at >= timezone.now().date():
            return True
        try:
            return self.subscription.status == 'active'
        except Exception:
            return False

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.account_number:
            self.account_number = f'EF-{self.pk:05d}'
            Tenant.objects.filter(pk=self.pk).update(account_number=self.account_number)

    def generate_qr_code(self):
        """Generate SVG QR code pointing to https://{slug}.eventifood.com and store it."""
        import re
        url = f"https://{self.slug}.eventifood.com"
        factory = qrcode.image.svg.SvgPathImage
        img = qrcode.make(url, image_factory=factory, box_size=10)
        stream = io.BytesIO()
        img.save(stream)
        svg = stream.getvalue().decode('utf-8')
        # Extract dimensions and add viewBox so the SVG scales with CSS
        m = re.search(r'width="(\d+)".*?height="(\d+)"', svg)
        if m:
            w, h = m.group(1), m.group(2)
            svg = re.sub(r'(<svg[^>]*?)width="\d+"', r'\1', svg)
            svg = re.sub(r'(<svg[^>]*?)height="\d+"', r'\1', svg)
            if 'viewBox' not in svg:
                svg = svg.replace('<svg ', f'<svg viewBox="0 0 {w} {h}" ', 1)
        self.qr_code_svg = svg
