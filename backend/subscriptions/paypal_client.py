"""
PayPal Subscriptions API v1 client.
Used to collect recurring subscription fees from sellers on subscription-tier plans.

Credentials resolved dynamically per-call via sandbox_helpers so sandbox mode
toggled in PlatformConfig takes effect without a server restart.
"""
import requests
from payments.sandbox_helpers import get_paypal_credentials


def _get_token() -> str:
    cid, secret, base = get_paypal_credentials()
    r = requests.post(
        f'{base}/v1/oauth2/token',
        auth=(cid, secret),
        data={'grant_type': 'client_credentials'},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()['access_token']


def create_subscription(paypal_plan_id: str, tenant_slug: str, return_url: str, cancel_url: str) -> dict:
    """
    Create a PayPal subscription for a seller.
    Returns dict with 'id' (subscription ID) and 'approval_url' (redirect the seller here).
    """
    token = _get_token()
    _, _, base = get_paypal_credentials()
    r = requests.post(
        f'{base}/v1/billing/subscriptions',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        },
        json={
            'plan_id': paypal_plan_id,
            'custom_id': tenant_slug,
            'application_context': {
                'brand_name': 'Eventifood',
                'locale': 'en-GB',
                'shipping_preference': 'NO_SHIPPING',
                'user_action': 'SUBSCRIBE_NOW',
                'payment_method': {
                    'payer_selected': 'PAYPAL',
                    'payee_preferred': 'IMMEDIATE_PAYMENT_REQUIRED',
                },
                'return_url': return_url,
                'cancel_url': cancel_url,
            },
        },
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()
    approval_url = next(
        (link['href'] for link in data.get('links', []) if link['rel'] == 'approve'),
        None,
    )
    return {'id': data['id'], 'approval_url': approval_url}


def get_subscription(subscription_id: str) -> dict:
    """Fetch current status of a PayPal subscription."""
    token = _get_token()
    _, _, base = get_paypal_credentials()
    r = requests.get(
        f'{base}/v1/billing/subscriptions/{subscription_id}',
        headers={'Authorization': f'Bearer {token}'},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def cancel_subscription(subscription_id: str, reason: str = 'Cancelled by seller') -> None:
    """Cancel an active PayPal subscription."""
    token = _get_token()
    _, _, base = get_paypal_credentials()
    r = requests.post(
        f'{base}/v1/billing/subscriptions/{subscription_id}/cancel',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        },
        json={'reason': reason},
        timeout=15,
    )
    if r.status_code != 204:
        r.raise_for_status()
