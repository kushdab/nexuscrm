"""
Stripe client — initialised once from settings.
Usage:
    from app.billing.stripe_client import stripe_client
"""
import stripe
from app.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY
stripe_client = stripe
