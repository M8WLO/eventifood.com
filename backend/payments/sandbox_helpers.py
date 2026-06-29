"""
Central credential resolver for payment providers.
When PlatformConfig.sandbox_mode is True, test/sandbox credentials are used.
"""
import os


def _sandbox_mode() -> bool:
    from accounts.models import PlatformConfig
    try:
        return PlatformConfig.get().sandbox_mode
    except Exception:
        return False


def get_stripe_key() -> str:
    if _sandbox_mode():
        return os.environ.get('STRIPE_SECRET_KEY_TEST', os.environ.get('STRIPE_SECRET_KEY', ''))
    return os.environ.get('STRIPE_SECRET_KEY', '')


def get_stripe_webhook_secret() -> str:
    if _sandbox_mode():
        return os.environ.get('STRIPE_WEBHOOK_SECRET_TEST', os.environ.get('STRIPE_WEBHOOK_SECRET', ''))
    return os.environ.get('STRIPE_WEBHOOK_SECRET', '')


def get_paypal_credentials() -> tuple[str, str, str]:
    """Returns (client_id, client_secret, base_url)."""
    if _sandbox_mode():
        cid = os.environ.get('PAYPAL_CLIENT_ID_SANDBOX', os.environ.get('PAYPAL_CLIENT_ID', ''))
        secret = os.environ.get('PAYPAL_CLIENT_SECRET_SANDBOX', os.environ.get('PAYPAL_CLIENT_SECRET', ''))
        base = 'https://api-m.sandbox.paypal.com'
    else:
        cid = os.environ.get('PAYPAL_CLIENT_ID', '')
        secret = os.environ.get('PAYPAL_CLIENT_SECRET', '')
        base = 'https://api-m.paypal.com'
    return cid, secret, base


def get_gocardless_credentials() -> tuple[str, str]:
    """Returns (access_token, base_url)."""
    if _sandbox_mode():
        token = os.environ.get('GOCARDLESS_ACCESS_TOKEN_SANDBOX', os.environ.get('GOCARDLESS_ACCESS_TOKEN', ''))
        base = 'https://api-sandbox.gocardless.com'
    else:
        token = os.environ.get('GOCARDLESS_ACCESS_TOKEN', '')
        base = 'https://api.gocardless.com'
    return token, base


def get_gocardless_webhook_secret() -> str:
    if _sandbox_mode():
        return os.environ.get('GOCARDLESS_WEBHOOK_SECRET_SANDBOX', os.environ.get('GOCARDLESS_WEBHOOK_SECRET', ''))
    return os.environ.get('GOCARDLESS_WEBHOOK_SECRET', '')
