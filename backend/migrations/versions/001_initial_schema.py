"""Initial schema — organisations, users, contacts, deals

Revision ID: 001
Revises:
Create Date: 2026-06-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organisations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), unique=True),
        sa.Column("plan", sa.String(50), default="free"),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("role", sa.String(50), default="member"),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organisations.id"), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_table(
        "contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organisations.id"), nullable=False),
        sa.Column("first_name", sa.String(100)),
        sa.Column("last_name", sa.String(100)),
        sa.Column("email", sa.String(255)),
        sa.Column("phone", sa.String(50)),
        sa.Column("company", sa.String(255)),
        sa.Column("title", sa.String(100)),
        sa.Column("notes", sa.Text),
        sa.Column("stage", sa.String(50), default="lead"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_table(
        "deals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organisations.id"), nullable=False),
        sa.Column("contact_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("contacts.id"), nullable=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("value", sa.Numeric(14, 2), default=0),
        sa.Column("stage", sa.String(50), default="prospecting"),
        sa.Column("probability", sa.Numeric(5, 2), default=0),
        sa.Column("currency", sa.String(10), default="USD"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_contacts_org_id", "contacts", ["org_id"])
    op.create_index("ix_deals_org_id", "deals", ["org_id"])


def downgrade() -> None:
    op.drop_table("deals")
    op.drop_table("contacts")
    op.drop_table("users")
    op.drop_table("organisations")
