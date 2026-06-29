"""
GoCardless Pro client for platform subscription billing.
Used to bill sellers their monthly/annual Eventifood plan fee via Direct Debit.

Uses the PLATFORM's GoCardless account (GOCARDLESS_ACCESS_TOKEN env var).
Sandbox mode (PlatformConfig.sandbox_mode=True) switches to sandbox credentials.
"""
import gocardless_pro
from .sandbox_helpers import get_gocardless_credentials


def _client() -> gocardless_pro.Client:
    token, base_url = get_gocardless_credentials()
    environment = 'sandbox' if 'sandbox' in base_url else 'live'
    return gocardless_pro.Client(access_token=token, environment=environment)


def create_redirect_flow(
    description: str,
    session_token: str,
    success_redirect_url: str,
    prefilled_email: str = '',
) -> gocardless_pro.resources.RedirectFlow:
    client = _client()
    params = {
        'description': description,
        'session_token': session_token,
        'success_redirect_url': success_redirect_url,
    }
    if prefilled_email:
        params['prefilled_customer'] = {'email': prefilled_email}
    return client.redirect_flows.create(params=params)


def complete_redirect_flow(
    redirect_flow_id: str,
    session_token: str,
) -> gocardless_pro.resources.RedirectFlow:
    client = _client()
    return client.redirect_flows.complete(
        redirect_flow_id,
        params={'session_token': session_token},
    )


def create_subscription(
    mandate_id: str,
    amount_pence: int,
    interval_unit: str,
    name: str,
    metadata: dict,
) -> gocardless_pro.resources.Subscription:
    """
    interval_unit: 'monthly' | 'yearly'
    amount_pence: e.g. 999 for £9.99
    """
    client = _client()
    return client.subscriptions.create(params={
        'amount': amount_pence,
        'currency': 'GBP',
        'interval_unit': interval_unit,
        'name': name,
        'links': {'mandate': mandate_id},
        'metadata': metadata,
    })


def cancel_subscription(gc_subscription_id: str) -> None:
    client = _client()
    client.subscriptions.cancel(gc_subscription_id)


def cancel_mandate(mandate_id: str) -> None:
    client = _client()
    client.mandates.cancel(mandate_id)
