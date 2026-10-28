"""drop encrypted_paypal_payment_token from orders

Revision ID: ae2ab8923db2
Revises: 78b11d3b6124
Create Date: 2026-10-28 01:27:32.302000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae2ab8923db2'
down_revision: Union[str, Sequence[str], None] = '78b11d3b6124'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
