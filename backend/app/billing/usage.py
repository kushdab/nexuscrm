"""
Usage metering — track seat and contact counts against plan limits.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from app.models.user import User
from app.models.contact import Contact
from app.billing.plans import PLAN_LIMITS, Plan


async def get_usage_summary(org_id: str, plan: str, db: AsyncSession) -> dict:
    user_count = (await db.execute(
        select(func.count()).select_from(User).where(User.org_id == org_id)
    )).scalar_one()
    contact_count = (await db.execute(
        select(func.count()).select_from(Contact).where(Contact.org_id == org_id)
    )).scalar_one()

    try:
        limits = PLAN_LIMITS[Plan(plan)]
    except ValueError:
        limits = PLAN_LIMITS[Plan.STARTER]

    return {
        "plan": plan,
        "users": {"used": user_count,  "limit": limits["max_users"]},
        "contacts": {"used": contact_count, "limit": limits["max_contacts"]},
    }
