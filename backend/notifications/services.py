import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def notify_order_ready(order) -> None:
    """Send order-ready notification to buyer via email and SMS."""
    _send_order_ready_email(order)
    _send_order_ready_sms(order)


def _send_order_ready_email(order) -> None:
    store_name = order.tenant.name
    order_number = order.order_number

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your order is ready!</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="background:#7c3aed;border-radius:16px 16px 0 0;padding:36px 40px 28px;text-align:center;">
          <div style="font-size:56px;margin-bottom:12px;">🔔</div>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
            Your order is hot &amp; ready!
          </h1>
          <p style="margin:10px 0 0;color:#c4b5fd;font-size:16px;">Head to the counter to collect it now.</p>
        </td></tr>

        <!-- Order number band -->
        <tr><td style="background:#6d28d9;padding:16px 40px;text-align:center;">
          <p style="margin:0;color:#ede9fe;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Order number</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:36px;font-weight:900;letter-spacing:2px;">{order_number}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;">
          <p style="margin:0 0 8px;color:#374151;font-size:16px;">Hi <strong>{order.buyer_name}</strong>,</p>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
            Your order at <strong style="color:#374151;">{store_name}</strong> is ready and waiting for you.
            Bring this email or just quote your order number at the counter.
          </p>

          <div style="background:#f5f3ff;border:2px solid #ede9fe;border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:28px;">
            <p style="margin:0;color:#7c3aed;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Collect at</p>
            <p style="margin:6px 0 0;color:#1f2937;font-size:20px;font-weight:800;">{store_name}</p>
          </div>

          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
            Sent by <a href="https://eventifood.com" style="color:#7c3aed;text-decoration:none;">Eventifood</a> on behalf of {store_name}.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">
            © Eventifood · <a href="https://eventifood.com" style="color:#9ca3af;">eventifood.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    plain = (
        f"Hi {order.buyer_name},\n\n"
        f"Your order {order_number} at {store_name} is ready for collection!\n\n"
        f"Please head to the counter to pick it up.\n\n"
        f"— {store_name} via Eventifood"
    )

    send_mail(
        subject=f"🔔 Your order {order_number} is ready — {store_name}",
        message=plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.buyer_email],
        html_message=html,
        fail_silently=True,
    )


def _send_order_ready_sms(order) -> None:
    """SMS stub — logs only, no third-party calls."""
    if order.buyer_phone:
        logger.info(
            "[SMS STUB] Order ready SMS to %s: Order %s ready at %s",
            order.buyer_phone,
            order.order_number,
            order.tenant.name,
        )


def send_order_confirmation_email(order) -> None:
    """Receipt email to buyer when order is placed."""
    store_name = order.tenant.name
    order_number = order.order_number
    store_url = f"https://{order.tenant.slug}.eventifood.com"

    # Build item rows
    item_rows_html = ""
    item_rows_plain = ""
    for item in order.items.prefetch_related('extras').all():
        extras = item.extras.all()
        extras_html = ""
        extras_plain = ""
        for extra in extras:
            extras_html += f'<div style="color:#9ca3af;font-size:12px;margin-top:2px;">+ {extra.name} (+£{extra.additional_price})</div>'
            extras_plain += f"\n      + {extra.name} (+£{extra.additional_price})"

        item_rows_html += f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
            <div style="color:#1f2937;font-size:15px;font-weight:600;">{item.product_name}</div>
            <div style="color:#6b7280;font-size:13px;margin-top:2px;">{item.variation_name}</div>
            {extras_html}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;vertical-align:top;white-space:nowrap;">
            <div style="color:#6b7280;font-size:13px;">x{item.quantity}</div>
            <div style="color:#1f2937;font-size:15px;font-weight:700;">£{item.subtotal}</div>
          </td>
        </tr>"""

        item_rows_plain += f"  • {item.quantity}x {item.product_name} ({item.variation_name}){extras_plain} — £{item.subtotal}\n"

    notes_html = ""
    if order.notes:
        notes_html = f"""
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
          <p style="margin:0;color:#92400e;font-size:13px;font-weight:600;">Note to kitchen</p>
          <p style="margin:4px 0 0;color:#78350f;font-size:14px;">{order.notes}</p>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Order confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="background:#7c3aed;border-radius:16px 16px 0 0;padding:32px 40px 24px;text-align:center;">
          <div style="font-size:48px;margin-bottom:10px;">🧾</div>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
            Order confirmed!
          </h1>
          <p style="margin:8px 0 0;color:#c4b5fd;font-size:15px;">{store_name} has received your order.</p>
        </td></tr>

        <!-- Order number band -->
        <tr><td style="background:#6d28d9;padding:14px 40px;text-align:center;">
          <p style="margin:0;color:#ede9fe;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your order number</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:34px;font-weight:900;letter-spacing:2px;">{order_number}</p>
          <p style="margin:4px 0 0;color:#c4b5fd;font-size:13px;">Keep this handy — we'll call it when ready.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;">
          <p style="margin:0 0 24px;color:#374151;font-size:16px;">Hi <strong>{order.buyer_name}</strong>, thanks for your order!</p>

          {notes_html}

          <!-- Items -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            {item_rows_html}
          </table>

          <!-- Total -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding:14px 16px;background:#f5f3ff;border-radius:10px;">
                <span style="color:#374151;font-size:15px;font-weight:600;">Total paid</span>
              </td>
              <td style="padding:14px 16px;background:#f5f3ff;border-radius:10px;text-align:right;">
                <span style="color:#7c3aed;font-size:20px;font-weight:800;">£{order.total}</span>
              </td>
            </tr>
          </table>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:28px;text-align:center;">
            <p style="margin:0;color:#166534;font-size:14px;">
              ✅ We'll send you another email when your order is <strong>hot &amp; ready</strong> to collect.
            </p>
          </div>

          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
            Powered by <a href="https://eventifood.com" style="color:#7c3aed;text-decoration:none;">Eventifood</a>
            · Ordered from <a href="{store_url}" style="color:#7c3aed;text-decoration:none;">{store_name}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">
            © Eventifood · <a href="https://eventifood.com" style="color:#9ca3af;">eventifood.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    plain = (
        f"Hi {order.buyer_name},\n\n"
        f"Order confirmed! {store_name} has received your order.\n\n"
        f"Order number: {order_number}\n\n"
        f"Items:\n{item_rows_plain}\n"
        f"Total: £{order.total}\n\n"
        f"We'll email you again when your order is ready to collect.\n\n"
        f"— {store_name} via Eventifood"
    )

    send_mail(
        subject=f"Order confirmed: {order_number} at {store_name}",
        message=plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.buyer_email],
        html_message=html,
        fail_silently=True,
    )
