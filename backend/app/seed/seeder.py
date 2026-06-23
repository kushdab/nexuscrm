"""
NexusCRM Demo Data Seeder
Run: python -m app.seed.seeder
Populates a fresh database with realistic demo data using Faker.
"""
import random
import asyncio
from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session_maker
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.contact import Contact, ContactStatus
from app.models.account import Account, AccountType, AccountIndustry
from app.models.lead import Lead, LeadStatus, LeadSource
from app.models.deal import Deal, DealStage
from app.models.activity import Activity, ActivityType
from app.auth.jwt import get_password_hash
from datetime import datetime, timedelta

fake = Faker()
random.seed(42)
Faker.seed(42)

INDUSTRIES = [i.value for i in AccountIndustry]
LEAD_SOURCES = [s.value for s in LeadSource]
DEAL_STAGES = [s.value for s in DealStage]
ACTIVITY_TYPES = [t.value for t in ActivityType]

async def seed_demo_org(session: AsyncSession, org_name: str = "Acme Corp Demo"):
    print(f"  Creating organisation: {org_name}")
    org = Organization(
        name=org_name,
        slug=org_name.lower().replace(" ", "-"),
        plan="professional",
        max_users=50,
        settings={"theme": "light", "currency": "USD", "timezone": "America/New_York"}
    )
    session.add(org)
    await session.flush()

    # Admin user
    admin = User(
        org_id=org.id,
        email="admin@demo.nexuscrm.io",
        full_name="Alex Johnson",
        hashed_password=get_password_hash("Demo1234!"),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    session.add(admin)

    # Regular users
    users = [admin]
    for i in range(4):
        u = User(
            org_id=org.id,
            email=fake.unique.company_email(),
            full_name=fake.name(),
            hashed_password=get_password_hash("Demo1234!"),
            role=random.choice([UserRole.SALES_REP, UserRole.MANAGER]),
            is_active=True, is_verified=True,
        )
        session.add(u)
        users.append(u)
    await session.flush()

    # Accounts (companies)
    print("  Creating accounts…")
    accounts = []
    for _ in range(30):
        acct = Account(
            org_id=org.id,
            name=fake.company(),
            industry=random.choice(INDUSTRIES),
            account_type=random.choice([t.value for t in AccountType]),
            website=fake.url(),
            phone=fake.phone_number(),
            billing_city=fake.city(),
            billing_country=fake.country(),
            annual_revenue=random.randint(100_000, 50_000_000),
            number_of_employees=random.randint(10, 10_000),
            owner_id=random.choice(users).id,
        )
        session.add(acct)
        accounts.append(acct)
    await session.flush()

    # Contacts
    print("  Creating contacts…")
    contacts = []
    for _ in range(120):
        acct = random.choice(accounts)
        c = Contact(
            org_id=org.id,
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.unique.email(),
            phone=fake.phone_number(),
            title=fake.job(),
            account_id=acct.id,
            owner_id=random.choice(users).id,
            status=random.choice([s.value for s in ContactStatus]),
            linkedin_url=f"https://linkedin.com/in/{fake.slug()}",
            city=fake.city(),
            country=fake.country(),
        )
        session.add(c)
        contacts.append(c)
    await session.flush()

    # Leads
    print("  Creating leads…")
    leads = []
    for _ in range(80):
        l = Lead(
            org_id=org.id,
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.unique.email(),
            phone=fake.phone_number(),
            company=fake.company(),
            title=fake.job(),
            source=random.choice(LEAD_SOURCES),
            status=random.choice([s.value for s in LeadStatus]),
            owner_id=random.choice(users).id,
            annual_revenue=random.randint(50_000, 5_000_000),
            number_of_employees=random.randint(5, 5000),
            description=fake.paragraph(),
            rating=random.choice(["hot", "warm", "cold"]),
        )
        session.add(l)
        leads.append(l)
    await session.flush()

    # Deals (Opportunities)
    print("  Creating deals…")
    for _ in range(60):
        created = fake.date_time_between(start_date="-1y", end_date="now")
        close_dt = created + timedelta(days=random.randint(14, 180))
        stage = random.choice(DEAL_STAGES)
        amount = random.randint(5_000, 500_000)
        d = Deal(
            org_id=org.id,
            name=f"{fake.bs().title()} — {fake.company()}",
            stage=stage,
            amount=amount,
            probability={"prospecting":10,"qualification":25,"needs_analysis":40,
                         "value_proposition":50,"id_decision_makers":60,
                         "perception_analysis":70,"proposal":80,"negotiation":90,
                         "closed_won":100,"closed_lost":0}.get(stage, 50),
            close_date=close_dt.date(),
            account_id=random.choice(accounts).id,
            contact_id=random.choice(contacts).id,
            owner_id=random.choice(users).id,
            source=random.choice(LEAD_SOURCES),
            description=fake.paragraph(),
            created_at=created,
        )
        session.add(d)
    await session.flush()

    # Activities
    print("  Creating activities…")
    for _ in range(200):
        act_date = fake.date_time_between(start_date="-6m", end_date="+1m")
        a = Activity(
            org_id=org.id,
            type=random.choice(ACTIVITY_TYPES),
            subject=fake.sentence(nb_words=6),
            description=fake.paragraph(),
            due_date=act_date,
            is_completed=random.random() > 0.4,
            owner_id=random.choice(users).id,
            contact_id=random.choice(contacts).id if random.random() > 0.3 else None,
            account_id=random.choice(accounts).id if random.random() > 0.5 else None,
        )
        session.add(a)

    await session.commit()
    print(f"  ✅ Demo data seeded for '{org_name}'")
    print(f"     Admin login → admin@demo.nexuscrm.io / Demo1234!")
    return org

async def main():
    print("🌱 NexusCRM Demo Seeder starting…")
    async with async_session_maker() as session:
        await seed_demo_org(session)
    print("\n🎉 Done! Your demo environment is ready.")

if __name__ == "__main__":
    asyncio.run(main())
