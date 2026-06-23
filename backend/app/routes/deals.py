from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.deal import Deal
from app.models.user import User

router = APIRouter(prefix="/deals", tags=["deals"])

STAGES = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]


class DealIn(BaseModel):
    title: str
    value: float = 0
    stage: str = "prospecting"
    probability: float = 0
    currency: str = "USD"
    contact_id: Optional[str] = None


class DealOut(DealIn):
    id: str
    org_id: str
    owner_id: Optional[str]
    class Config:
        from_attributes = True


@router.get("", response_model=dict)
async def list_deals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    stage: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Deal).where(Deal.org_id == current_user.org_id)
    if stage:
        q = q.where(Deal.stage == stage)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.order_by(Deal.created_at.desc()).offset(skip).limit(limit))).scalars().all()
    pipeline_value = sum(float(r.value or 0) for r in rows)
    return {"total": total, "pipeline_value": pipeline_value, "items": [_fmt(d) for d in rows]}


@router.post("", response_model=DealOut, status_code=201)
async def create_deal(
    body: DealIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import uuid
    d = Deal(
        title=body.title, value=Decimal(str(body.value)), stage=body.stage,
        probability=Decimal(str(body.probability)), currency=body.currency,
        org_id=current_user.org_id, owner_id=current_user.id,
        contact_id=uuid.UUID(body.contact_id) if body.contact_id else None,
    )
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return _fmt(d)


@router.get("/{deal_id}", response_model=DealOut)
async def get_deal(deal_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _fmt(await _get_or_404(deal_id, current_user.org_id, db))


@router.patch("/{deal_id}", response_model=DealOut)
async def update_deal(deal_id: str, body: DealIn, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = await _get_or_404(deal_id, current_user.org_id, db)
    for k, v in body.model_dump(exclude_none=True).items():
        if k == "value":
            v = Decimal(str(v))
        elif k == "probability":
            v = Decimal(str(v))
        setattr(d, k, v)
    await db.commit()
    await db.refresh(d)
    return _fmt(d)


@router.delete("/{deal_id}", status_code=204)
async def delete_deal(deal_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = await _get_or_404(deal_id, current_user.org_id, db)
    await db.delete(d)
    await db.commit()


async def _get_or_404(deal_id, org_id, db):
    import uuid
    row = (await db.execute(
        select(Deal).where(Deal.id == uuid.UUID(deal_id), Deal.org_id == org_id)
    )).scalar_one_or_none()
    if not row:
        raise HTTPException(404, "Deal not found")
    return row


def _fmt(d: Deal) -> dict:
    return {
        "id": str(d.id), "org_id": str(d.org_id),
        "title": d.title, "value": float(d.value or 0),
        "stage": d.stage, "probability": float(d.probability or 0),
        "currency": d.currency,
        "contact_id": str(d.contact_id) if d.contact_id else None,
        "owner_id": str(d.owner_id) if d.owner_id else None,
    }
