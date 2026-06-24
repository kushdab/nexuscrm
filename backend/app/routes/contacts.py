from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.contact import Contact
from app.models.user import User

router = APIRouter(prefix="/contacts", tags=["contacts"])


# ── Schemas ────────────────────────────────────────────────────────────────────
class ContactIn(BaseModel):
    first_name: str = ""
    last_name:  str = ""
    email:      Optional[str] = None
    phone:      Optional[str] = None
    company:    Optional[str] = None
    title:      Optional[str] = None
    notes:      Optional[str] = None
    stage:      str = "lead"
    city:       Optional[str] = None
    state:      Optional[str] = None
    country:    Optional[str] = None
    zip_code:   Optional[str] = None


class ContactOut(ContactIn):
    id:     str
    org_id: str
    class Config:
        from_attributes = True


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.get("", response_model=dict)
async def list_contacts(
    skip:      int = Query(0, ge=0),
    limit:     int = Query(50, le=200),
    offset:    int = Query(0, ge=0),
    search:    Optional[str] = None,
    stage:     Optional[str] = None,
    sort_by:   str = Query("first_name"),
    sort_dir:  str = Query("asc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    effective_offset = offset or skip
    q = select(Contact).where(Contact.org_id == current_user.org_id)
    if search:
        term = f"%{search}%"
        q = q.where(or_(
            Contact.first_name.ilike(term), Contact.last_name.ilike(term),
            Contact.email.ilike(term), Contact.company.ilike(term),
        ))
    if stage:
        q = q.where(Contact.stage == stage)
    col = getattr(Contact, sort_by, Contact.first_name)
    q = q.order_by(col.desc() if sort_dir == "desc" else col.asc())
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows  = (await db.execute(q.offset(effective_offset).limit(limit))).scalars().all()
    return {"total": total, "items": [_fmt(c) for c in rows]}


@router.get("/locations", response_model=list)
async def contact_locations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return unique (city, state, country) groups with counts for the map."""
    rows = (await db.execute(
        select(Contact.city, Contact.state, Contact.country, func.count().label("n"))
        .where(Contact.org_id == current_user.org_id)
        .where(or_(Contact.state.isnot(None), Contact.country.isnot(None)))
        .group_by(Contact.city, Contact.state, Contact.country)
        .order_by(func.count().desc())
        .limit(50)
    )).all()
    return [{"city": r.city, "state": r.state, "country": r.country, "count": r.n} for r in rows]


@router.post("", response_model=ContactOut, status_code=201)
async def create_contact(
    body: ContactIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = Contact(**body.model_dump(), org_id=current_user.org_id)
    db.add(c); await db.commit(); await db.refresh(c)
    return _fmt(c)


@router.get("/{contact_id}", response_model=ContactOut)
async def get_contact(
    contact_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _fmt(await _get_or_404(contact_id, current_user.org_id, db))


@router.patch("/{contact_id}", response_model=ContactOut)
async def update_contact(
    contact_id: str,
    body: ContactIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = await _get_or_404(contact_id, current_user.org_id, db)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    await db.commit(); await db.refresh(c)
    return _fmt(c)


@router.put("/{contact_id}", response_model=ContactOut)
async def replace_contact(
    contact_id: str,
    body: ContactIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = await _get_or_404(contact_id, current_user.org_id, db)
    for k, v in body.model_dump().items():
        setattr(c, k, v)
    await db.commit(); await db.refresh(c)
    return _fmt(c)


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = await _get_or_404(contact_id, current_user.org_id, db)
    await db.delete(c); await db.commit()


# ── Helpers ────────────────────────────────────────────────────────────────────
async def _get_or_404(contact_id, org_id, db):
    import uuid
    row = (await db.execute(
        select(Contact).where(Contact.id == uuid.UUID(contact_id), Contact.org_id == org_id)
    )).scalar_one_or_none()
    if not row: raise HTTPException(404, "Contact not found")
    return row


def _fmt(c: Contact) -> dict:
    return {
        "id": str(c.id), "org_id": str(c.org_id),
        "first_name": c.first_name, "last_name": c.last_name,
        "email": c.email, "phone": c.phone,
        "company": c.company, "title": c.title,
        "notes": c.notes, "stage": c.stage,
        "city": c.city, "state": c.state,
        "country": c.country, "zip_code": c.zip_code,
    }
