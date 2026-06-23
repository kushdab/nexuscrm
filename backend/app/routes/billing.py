"""
Billing routes — Stripe Checkout, portal, and webhooks.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
import stripe

from app.database import get_db
from app.auth.jwt import get_current_user
from app.billing import service as billing_svc
from app.billing.plans import Plan
from app.config import settings
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout/{plan}")
async def start_checkout(
    plan: Plan,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Redirect to Stripe Checkout for the chosen plan."""
    base = str(request.base_url).rstrip("/")
    url = await billing_svc.create_checkout_session(
        org_id=str(current_user.org_id),
        plan=plan,
        success_url=f"{base}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{base}/billing/cancel",
    )
    return {"checkout_url": url}


@router.get("/portal")
async def customer_portal(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Redirect to Stripe Customer Portal to manage subscription."""
    from app.database import async_session_maker
    from sqlalchemy import select
    from app.models.organization import Organization
    async with async_session_maker() as db:
        result = await db.execute(
            select(Organization).where(Organization.id == current_user.org_id)
        )
        org = result.scalar_one_or_none()
    if not org or not org.stripe_customer_id:
        raise HTTPException(404, "No billing account found")
    base = str(request.base_url).rstrip("/")
    url = await billing_svc.create_customer_portal_session(
        customer_id=org.stripe_customer_id,
        return_url=f"{base}/settings/billing",
    )
    return {"portal_url": url}


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Stripe webhook endpoint — verify signature then dispatch events."""
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid Stripe signature")

    if event["type"] == "checkout.session.completed":
        await billing_svc.handle_checkout_completed(db, event["data"]["object"])
    elif event["type"] in ("customer.subscription.updated", "customer.subscription.deleted"):
        await billing_svc.handle_subscription_updated(db, event["data"]["object"])

    return {"received": True}
