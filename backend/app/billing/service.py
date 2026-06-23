"""
Billing service — wraps Stripe operations for NexusCRM.
"""
from __future__ import annotations
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.billing.stripe_client import stripe_client
from app.billing.plans import PRICE_IDS, Plan
from app.models.organization import Organization


async def create_checkout_session(
    org_id: str,
    plan: Plan,
    success_url: str,
    cancel_url: str,
) -> str:
    """Create a Stripe Checkout session and return the redirect URL."""
    session = stripe_client.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": PRICE_IDS[plan], "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"org_id": org_id, "plan": plan.value},
        subscription_data={"metadata": {"org_id": org_id}},
    )
    return session.url


async def create_customer_portal_session(customer_id: str, return_url: str) -> str:
    """Redirect existing subscriber to Stripe Customer Portal."""
    session = stripe_client.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return session.url


async def handle_checkout_completed(
    db: AsyncSession,
    stripe_session: dict,
) -> None:
    """Activate subscription after successful checkout."""
    org_id = stripe_session["metadata"]["org_id"]
    plan   = stripe_session["metadata"]["plan"]
    customer_id   = stripe_session["customer"]
    subscription_id = stripe_session["subscription"]

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if org:
        org.plan = plan
        org.stripe_customer_id = customer_id
        org.stripe_subscription_id = subscription_id
        await db.commit()


async def handle_subscription_updated(db: AsyncSession, subscription: dict) -> None:
    """Sync plan changes (upgrades / downgrades) to our DB."""
    org_id = subscription.get("metadata", {}).get("org_id")
    if not org_id:
        return
    new_status = subscription["status"]
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if org:
        org.subscription_status = new_status
        if new_status != "active":
            org.plan = "starter"  # downgrade on cancellation
        await db.commit()
