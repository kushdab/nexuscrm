from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.organisation import Organisation
from app.models.user import User

router = APIRouter(prefix="/org", tags=["organisation"])


class OrgOut(BaseModel):
    id: str
    name: str
    slug: str
    plan: str


@router.get("", response_model=OrgOut)
async def get_org(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    org = (await db.execute(select(Organisation).where(Organisation.id == current_user.org_id))).scalar_one_or_none()
    return OrgOut(id=str(org.id), name=org.name, slug=org.slug, plan=org.plan)


@router.get("/stats")
async def org_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    org_id = current_user.org_id
    contacts_count = (await db.execute(select(func.count()).where(Contact.org_id == org_id))).scalar()
    deals_q = select(Deal).where(Deal.org_id == org_id, Deal.stage.notin_(["closed_won", "closed_lost"]))
    open_deals = (await db.execute(select(func.count()).select_from(deals_q.subquery()))).scalar()
    all_open = (await db.execute(deals_q)).scalars().all()
    pipeline_value = sum(float(d.value or 0) for d in all_open)
    return {
        "contacts": contacts_count,
        "open_deals": open_deals,
        "pipeline_value": pipeline_value,
    }
