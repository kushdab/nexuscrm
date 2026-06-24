"""Add city, state, country, zip_code to contacts

Revision ID: 003
Revises: 002
Create Date: 2026-06-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # state & country were added in 002; add city & zip_code here.
    # Use IF NOT EXISTS guards so re-runs are safe.
    with op.get_context().autocommit_block():
        op.execute("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city     VARCHAR(100)")
        op.execute("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20)")
        # Ensure 002 columns also exist (idempotent)
        op.execute("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS state   VARCHAR(100)")
        op.execute("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country VARCHAR(100)")


def downgrade() -> None:
    op.drop_column("contacts", "city")
    op.drop_column("contacts", "zip_code")
    op.drop_column("contacts", "state")
    op.drop_column("contacts", "country")
