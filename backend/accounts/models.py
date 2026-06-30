from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_superadmin', True)
        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superadmin = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    mfa_enabled = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = UserManager()

    class Meta:
        ordering = ['email']

    def __str__(self):
        return f"{self.full_name} <{self.email}>"


class TenantMembership(models.Model):
    ROLES = [('owner', 'Owner'), ('staff', 'Staff')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=20, choices=ROLES, default='owner')

    class Meta:
        unique_together = ('user', 'tenant')
        ordering = ['tenant', 'role']

    def __str__(self):
        return f"{self.user.email} @ {self.tenant.slug} ({self.role})"


class PlatformConfig(models.Model):
    mfa_required = models.BooleanField(default=True)
    sandbox_mode = models.BooleanField(default=False)
    health_check_emails = models.TextField(
        blank=True, default='filemakers@gmail.com',
        help_text='Comma-separated list of addresses to receive hourly health reports.',
    )
    health_check_subject = models.CharField(
        max_length=200, blank=True, default='Eventifood Health Report',
        help_text='Subject prefix used in health report emails.',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Platform Config'

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def get_health_check_email_list(self):
        return [e.strip() for e in self.health_check_emails.split(',') if e.strip()]


class EmailOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.user.email} (used={self.is_used})"

    @property
    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
