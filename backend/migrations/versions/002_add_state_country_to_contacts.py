"""Add state and country to contacts

Revision ID: 002
Revises: 001
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("contacts", sa.Column("state",   sa.String(100), nullable=True))
    op.add_column("contacts", sa.Column("country", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("contacts", "country")
    op.drop_column("contacts", "state")
