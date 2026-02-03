"""add load extractions

Revision ID: 42c2a2f9d8b1
Revises: f38d10b04471
Create Date: 2026-02-03 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "42c2a2f9d8b1"
down_revision = "f38d10b04471"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "load_extractions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("load_id", sa.Integer(), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("source_files", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["load_id"], ["loads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_load_extractions_id", "load_extractions", ["id"], unique=False)
    op.create_index("ix_load_extractions_load_id", "load_extractions", ["load_id"], unique=False)


def downgrade():
    op.drop_index("ix_load_extractions_load_id", table_name="load_extractions")
    op.drop_index("ix_load_extractions_id", table_name="load_extractions")
    op.drop_table("load_extractions")
