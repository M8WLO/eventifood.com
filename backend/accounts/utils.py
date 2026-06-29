import random
import string
import hmac
import hashlib
import time
import requests as http_requests
from django.conf import settings


def generate_otp_code() -> str:
    """Generate a 6-digit numeric OTP code. Returns 000000 in TEST_MODE."""
    if getattr(settings, 'TEST_MODE', False):
        return '000000'
    return ''.join(random.choices(string.digits, k=6))


def send_otp_email(user, code: str) -> bool:
    """Send the OTP code via Resend HTTP API. Returns True on success."""
    api_key = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@eventifood.com')
    try:
        resp = http_requests.post(
            'https://api.resend.com/emails',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={
                'from': from_email,
                'to': [user.email],
                'subject': 'Your Eventifood login code',
                'text': (
                    f"Hi {user.full_name},\n\n"
                    f"Your one-time login code is: {code}\n\n"
                    f"This code expires in 10 minutes.\n\n"
                    f"If you didn't request this, please ignore this email.\n\n"
                    f"— Eventifood"
                ),
            },
            timeout=15,
        )
        return resp.status_code == 200
    except Exception:
        return False


def make_email_verify_token(user_id: int) -> str:
    """Create a signed token for email verification (24-hour expiry)."""
    timestamp = str(int(time.time()))
    payload = f"ev:{user_id}:{timestamp}"
    key = getattr(settings, 'SECRET_KEY', '').encode()
    sig = hmac.new(key, payload.encode(), hashlib.sha256).hexdigest()
    return f"{user_id}:{timestamp}:{sig}"


def verify_email_token(token: str, max_age: int = 86400) -> int | None:
    """Verify email token; returns user_id or None. Default 24-hour expiry."""
    try:
        parts = token.split(':')
        if len(parts) != 3:
            return None
        user_id, timestamp, sig = parts
        payload = f"ev:{user_id}:{timestamp}"
        key = getattr(settings, 'SECRET_KEY', '').encode()
        expected_sig = hmac.new(key, payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        age = int(time.time()) - int(timestamp)
        if age > max_age:
            return None
        return int(user_id)
    except (ValueError, TypeError):
        return None


def send_verification_email(user, token: str) -> bool:
    """Send account verification email via Resend HTTP API. Returns True on success."""
    api_key = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@eventifood.com')
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://eventifood.com')
    verify_url = f"{frontend_url}/verify-email?token={token}"
    try:
        resp = http_requests.post(
            'https://api.resend.com/emails',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={
                'from': from_email,
                'to': [user.email],
                'subject': 'Verify your Eventifood account',
                'text': (
                    f"Hi {user.full_name},\n\n"
                    f"Thanks for signing up to Eventifood! Click the link below to verify your email and activate your store:\n\n"
                    f"{verify_url}\n\n"
                    f"This link expires in 24 hours.\n\n"
                    f"If you didn't create an account, you can safely ignore this email.\n\n"
                    f"— Eventifood"
                ),
            },
            timeout=15,
        )
        return resp.status_code == 200
    except Exception:
        return False


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
