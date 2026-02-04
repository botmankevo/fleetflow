"""add customers table

Revision ID: add_customers_table
Revises: add_mapbox_broker_fields
Create Date: 2026-02-03

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_customers_table'
down_revision = 'add_mapbox_broker_fields'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('carrier_id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(200), nullable=False),
        sa.Column('mc_number', sa.String(50), nullable=True),
        sa.Column('dot_number', sa.String(50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('state', sa.String(20), nullable=True),
        sa.Column('zip_code', sa.String(20), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('email', sa.String(200), nullable=True),
        sa.Column('payment_terms', sa.String(50), nullable=True, server_default='Net 30'),
        sa.Column('credit_limit', sa.Float(), nullable=True),
        sa.Column('default_rate', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('customer_type', sa.String(20), nullable=True, server_default='broker'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['carrier_id'], ['carriers.id']),
    )
    
    op.create_index('ix_customers_id', 'customers', ['id'])
    op.create_index('ix_customers_carrier_id', 'customers', ['carrier_id'])
    op.create_index('ix_customers_company_name', 'customers', ['company_name'])


def downgrade():
    op.drop_index('ix_customers_company_name', table_name='customers')
    op.drop_index('ix_customers_carrier_id', table_name='customers')
    op.drop_index('ix_customers_id', table_name='customers')
    op.drop_table('customers')
