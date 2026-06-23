"""Seed endpoint — populates demo data for the authenticated org."""
import random
import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.user import User

router = APIRouter(prefix="/seed", tags=["seed"])

FIRST_NAMES = ["Alice", "Bob", "Carlos", "Diana", "Ethan", "Fatima", "George", "Hana", "Ivan", "Julia"]
LAST_NAMES  = ["Smith", "Okonkwo", "Müller", "Gupta", "Nakamura", "Silva", "Patel", "Chen", "Kim", "Novak"]
COMPANIES   = ["Acme Corp", "Globex", "Initech", "Umbrella Ltd", "Hooli", "Pied Piper", "Vehement Capital", "Dunder Mifflin"]
STAGES_C    = ["lead", "prospect", "customer", "churned"]
STAGES_D    = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]
TITLES      = ["CEO", "CTO", "VP Sales", "Account Executive", "Director", "Manager", "Founder"]


@router.post("")
async def seed_demo_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = current_user.org_id
    contacts = []
    for _ in range(30):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        c = Contact(
            id=uuid.uuid4(), org_id=org_id,
            first_name=fn, last_name=ln,
            email=f"{fn.lower()}.{ln.lower()}{random.randint(1,99)}@example.com",
            phone=f"+1-555-{random.randint(1000,9999)}",
            company=random.choice(COMPANIES),
            title=random.choice(TITLES),
            stage=random.choice(STAGES_C),
        )
        db.add(c)
        contacts.append(c)

    await db.flush()

    for i in range(20):
        contact = random.choice(contacts)
        deal = Deal(
            id=uuid.uuid4(), org_id=org_id,
            contact_id=contact.id, owner_id=current_user.id,
            title=f"Deal with {contact.company} #{i+1}",
            value=Decimal(str(round(random.uniform(5000, 250000), 2))),
            stage=random.choice(STAGES_D),
            probability=Decimal(str(round(random.uniform(10, 95), 0))),
            currency="USD",
        )
        db.add(deal)

    await db.commit()
    return {"seeded": {"contacts": 30, "deals": 20}}
