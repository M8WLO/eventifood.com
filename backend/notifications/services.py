import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def notify_order_ready(order) -> None:
    """Send order-ready notification to buyer via email and SMS."""
    _send_order_ready_email(order)
    _send_order_ready_sms(order)


def _send_order_ready_email(order) -> None:
    """Email the buyer that their order is ready to collect."""
    send_mail(
        subject=f"Your order {order.order_number} at {order.tenant.name} is ready!",
        message=(
            f"Hi {order.buyer_name},\n\n"
            f"Great news! Your order {order.order_number} at {order.tenant.name} is ready for collection.\n\n"
            f"Please head to the counter to pick it up.\n\n"
            f"Enjoy your meal!\n\n"
            f"— {order.tenant.name} via Eventifood"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.buyer_email],
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
    """Confirmation email to buyer when order is placed."""
    items_text = "\n".join(
        f"  • {item.quantity}x {item.product_name} ({item.variation_name}) — £{item.subtotal}"
        for item in order.items.all()
    )
    send_mail(
        subject=f"Order confirmed: {order.order_number} at {order.tenant.name}",
        message=(
            f"Hi {order.buyer_name},\n\n"
            f"Your order has been received!\n\n"
            f"Order number: {order.order_number}\n\n"
            f"Items:\n{items_text}\n\n"
            f"Total: £{order.total}\n\n"
            f"We'll let you know when your order is ready.\n\n"
            f"— {order.tenant.name} via Eventifood"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.buyer_email],
        fail_silently=True,
    )
