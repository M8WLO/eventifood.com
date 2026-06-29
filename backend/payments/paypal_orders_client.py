"""
PayPal Orders API v2 client.
Used for customer checkout payments at food truck stores.
Funds go directly to the tenant's PayPal Business account (payee.email_address).
No platform fee is collected through this flow — subscription tenants pay the platform separately.

Credentials resolved dynamically per-call via sandbox_helpers so sandbox mode
toggled in PlatformConfig takes effect without a server restart.
"""
import requests
from .sandbox_helpers import get_paypal_credentials


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


def create_order(
    amount_gbp: str,
    payee_email: str,
    order_number: str,
    store_name: str,
    return_url: str,
    cancel_url: str,
) -> dict:
    """
    Create a PayPal order for a customer to pay a store.
    Funds go to payee_email (the tenant's PayPal Business account).
    Returns {'id': paypal_order_id, 'approval_url': '...'}.
    """
    token = _get_token()
    _, _, base = get_paypal_credentials()
    r = requests.post(
        f'{base}/v2/checkout/orders',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        },
        json={
            'intent': 'CAPTURE',
            'purchase_units': [{
                'amount': {
                    'currency_code': 'GBP',
                    'value': amount_gbp,
                },
                'payee': {
                    'email_address': payee_email,
                },
                'custom_id': order_number,
                'description': f'Order at {store_name}',
            }],
            'application_context': {
                'brand_name': store_name,
                'locale': 'en-GB',
                'shipping_preference': 'NO_SHIPPING',
                'user_action': 'PAY_NOW',
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


def capture_order(paypal_order_id: str) -> dict:
    """
    Capture an approved PayPal order.
    Returns the full capture response. Raises on failure.
    """
    token = _get_token()
    _, _, base = get_paypal_credentials()
    r = requests.post(
        f'{base}/v2/checkout/orders/{paypal_order_id}/capture',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        },
        json={},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()
