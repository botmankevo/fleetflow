"""add document exchange table

Revision ID: 20260205_062433
Revises: 
Create Date: 2026-02-05 06:24:33

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260205_062433'
down_revision = '68019212c21b'  # Points to the merge head
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'document_exchange',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('carrier_id', sa.Integer(), nullable=False),
        sa.Column('load_id', sa.Integer(), nullable=False),
        sa.Column('driver_id', sa.Integer(), nullable=False),
        sa.Column('uploaded_by_user_id', sa.Integer(), nullable=False),
        sa.Column('doc_type', sa.String(length=50), nullable=False),
        sa.Column('attachment_url', sa.String(length=500), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('reviewed_by_user_id', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['carrier_id'], ['carriers.id'], ),
        sa.ForeignKeyConstraint(['load_id'], ['loads.id'], ),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_exchange_carrier_id'), 'document_exchange', ['carrier_id'], unique=False)
    op.create_index(op.f('ix_document_exchange_load_id'), 'document_exchange', ['load_id'], unique=False)
    op.create_index(op.f('ix_document_exchange_driver_id'), 'document_exchange', ['driver_id'], unique=False)
    op.create_index(op.f('ix_document_exchange_uploaded_by_user_id'), 'document_exchange', ['uploaded_by_user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_document_exchange_uploaded_by_user_id'), table_name='document_exchange')
    op.drop_index(op.f('ix_document_exchange_driver_id'), table_name='document_exchange')
    op.drop_index(op.f('ix_document_exchange_load_id'), table_name='document_exchange')
    op.drop_index(op.f('ix_document_exchange_carrier_id'), table_name='document_exchange')
    op.drop_table('document_exchange')
