import random
import string
import hmac
import hashlib
import time
from django.conf import settings
from django.core.mail import send_mail


def generate_otp_code() -> str:
    """Generate a 6-digit numeric OTP code. Returns 000000 in TEST_MODE."""
    if getattr(settings, 'TEST_MODE', False):
        return '000000'
    return ''.join(random.choices(string.digits, k=6))


def send_otp_email(user, code: str) -> None:
    """Send the OTP code to the user's email address."""
    send_mail(
        subject='Your Eventifood login code',
        message=(
            f"Hi {user.full_name},\n\n"
            f"Your one-time login code is: {code}\n\n"
            f"This code expires in 10 minutes.\n\n"
            f"If you didn't request this, please ignore this email.\n\n"
            f"— Eventifood"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def make_partial_token(user_id: int) -> str:
    """Create a signed partial token encoding the user ID."""
    timestamp = str(int(time.time()))
    payload = f"{user_id}:{timestamp}"
    key = getattr(settings, 'MFA_SIGNING_KEY', settings.SECRET_KEY).encode()
    sig = hmac.new(key, payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"


def verify_partial_token(token: str, max_age: int = 900) -> int | None:
    """
    Verify the partial token and return user_id or None.
    max_age is in seconds (default 15 minutes).
    """
    try:
        parts = token.split(':')
        if len(parts) != 3:
            return None
        user_id, timestamp, sig = parts
        payload = f"{user_id}:{timestamp}"
        key = getattr(settings, 'MFA_SIGNING_KEY', settings.SECRET_KEY).encode()
        expected_sig = hmac.new(key, payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        age = int(time.time()) - int(timestamp)
        if age > max_age:
            return None
        return int(user_id)
    except (ValueError, TypeError):
        return None
