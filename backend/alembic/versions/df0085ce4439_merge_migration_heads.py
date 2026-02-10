"""merge_migration_heads

Revision ID: df0085ce4439
Revises: 20260205_062433, add_customers_table
Create Date: 2026-02-06 17:24:02.640167

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df0085ce4439'
down_revision: Union[str, None] = ('20260205_062433', 'add_customers_table')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
