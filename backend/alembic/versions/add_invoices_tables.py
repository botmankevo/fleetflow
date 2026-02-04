"""add invoices tables

Revision ID: add_invoices_tables
Revises: add_customers_table
Create Date: 2026-02-03

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_invoices_tables'
down_revision = 'add_customers_table'
branch_labels = None
depends_on = None


def upgrade():
    # Create invoices table
    op.create_table(
        'invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('carrier_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('invoice_number', sa.String(100), nullable=False),
        sa.Column('invoice_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(20), nullable=True, server_default='draft'),
        sa.Column('subtotal', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('tax_amount', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('total_amount', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('amount_paid', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('balance_due', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('payment_terms', sa.String(50), nullable=True, server_default='Net 30'),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['carrier_id'], ['carriers.id']),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.UniqueConstraint('invoice_number'),
    )
    
    op.create_index('ix_invoices_id', 'invoices', ['id'])
    op.create_index('ix_invoices_carrier_id', 'invoices', ['carrier_id'])
    op.create_index('ix_invoices_customer_id', 'invoices', ['customer_id'])
    op.create_index('ix_invoices_invoice_number', 'invoices', ['invoice_number'])
    
    # Create invoice_line_items table
    op.create_table(
        'invoice_line_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=False),
        sa.Column('load_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=True, server_default='1.0'),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id']),
        sa.ForeignKeyConstraint(['load_id'], ['loads.id']),
    )
    
    op.create_index('ix_invoice_line_items_id', 'invoice_line_items', ['id'])
    op.create_index('ix_invoice_line_items_invoice_id', 'invoice_line_items', ['invoice_id'])


def downgrade():
    op.drop_index('ix_invoice_line_items_invoice_id', table_name='invoice_line_items')
    op.drop_index('ix_invoice_line_items_id', table_name='invoice_line_items')
    op.drop_table('invoice_line_items')
    
    op.drop_index('ix_invoices_invoice_number', table_name='invoices')
    op.drop_index('ix_invoices_customer_id', table_name='invoices')
    op.drop_index('ix_invoices_carrier_id', table_name='invoices')
    op.drop_index('ix_invoices_id', table_name='invoices')
    op.drop_table('invoices')
