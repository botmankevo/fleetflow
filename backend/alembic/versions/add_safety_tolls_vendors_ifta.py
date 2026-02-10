"""add safety tolls vendors ifta tables

Revision ID: add_safety_tolls_vendors
Revises: df0085ce4439
Create Date: 2026-02-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_safety_tolls_vendors'
down_revision = 'df0085ce4439'
branch_labels = None
depends_on = None


def upgrade():
    # Safety Events table
    op.create_table('safety_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('carrier_id', sa.Integer(), nullable=False),
        sa.Column('driver_id', sa.Integer(), nullable=True),
        sa.Column('equipment_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=True),
        sa.Column('event_date', sa.DateTime(), nullable=True),
        sa.Column('severity', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('citation_number', sa.String(length=100), nullable=True),
        sa.Column('points', sa.Integer(), nullable=True, default=0),
        sa.Column('fine_amount', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, default='open'),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['carrier_id'], ['carriers.id']),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id']),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_safety_events_carrier_id'), 'safety_events', ['carrier_id'], unique=False)
    
    # Safety Scores table
    op.create_table('safety_scores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('carrier_id', sa.Integer(), nullable=False),
        sa.Column('driver_id', sa.Integer(), nullable=True),
        sa.Column('csa_score', sa.Float(), nullable=True),
        sa.Column('accident_count', sa.Integer(), nullable=True, default=0),
        sa.Column('violation_count', sa.Integer(), nullable=True, default=0),
        sa.Column('inspection_count', sa.Integer(), nullable=True, default=0),
        sa.Column('clean_inspection_count', sa.Integer(), nullable=True, default=0),
        sa.Column('last_violation_date', sa.DateTime(), nullable=True),
        sa.Column('last_inspection_date', sa.DateTime(), nullable=True),
        sa.Column('safety_rating', sa.String(length=50), nullable=True, default='satisfactory'),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['carrier_id'], ['carriers.id']),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('driver_id')
    )
    op.create_index(op.f('ix_safety_scores_carrier_id'), 'safety_scores', ['carrier_id'], unique=False)
    
    # Vendors table
    op.create_table('vendors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('carrier_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('vendor_type', sa.String(length=100), nullable=True),
        sa.Column('contact_name', sa.String(length=200), nullable=True),
        sa.Column('email', sa.String(length=200), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('address', sa.String(length=300), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=2), nullable=True),
        sa.Column('zip_code', sa.String(length=20), nullable=True),
        sa.Column('tax_id', sa.String(length=50), nullable=True),
        sa.Column('payment_terms', sa.String(length=50), nullable=True),
        sa.Column('account_number', sa.String(length=100), nullable=True),
        sa.Column('website', sa.String(length=200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('preferred', sa.Boolean(), nullable=True, default=False),
        sa.Column('rating', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['carrier_id'], ['carriers.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendors_carrier_id'), 'vendors', ['carrier_id'], unique=False)
    
    # Toll Transponders table
    op.create_table('toll_transponders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('carrier_id', sa.Integer(), nullable=False),
        sa.Column('transponder_number', sa.String(length=100), nullable=True),
        sa.Column('provider', sa.String(length=100), nullable=True),
        sa.Column('equipment_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, default='active'),
        sa.Column('activation_date', sa.DateTime(), nullable=True),
        sa.Column('deactivation_date', sa.DateTime(), nullable=True),
        sa.Column('balance', sa.Float(), nullable=True, default=0.0),
        sa.Column('auto_replenish', sa.Boolean(), nullable=True, default=True),
        sa.Column('replenish_threshold', sa.Float(), nullable=True, default=20.0),
        sa.Column('replenish_amount', sa.Float(), nullable=True, default=50.0),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['carrier_id'], ['carriers.id']),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transponder_number')
    )
    op.create_index(op.f('ix_toll_transponders_carrier_id'), 'toll_transponders', ['carrier_id'], unique=False)
    
    # Toll Transactions table
    op.create_table('toll_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('carrier_id', sa.Integer(), nullable=False),
        sa.Column('load_id', sa.Integer(), nullable=True),
        sa.Column('driver_id', sa.Integer(), nullable=True),
        sa.Column('equipment_id', sa.Integer(), nullable=True),
        sa.Column('transponder_id', sa.Integer(), nullable=True),
        sa.Column('transaction_date', sa.DateTime(), nullable=True),
        sa.Column('toll_authority', sa.String(length=100), nullable=True),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('amount', sa.Float(), nullable=True),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, default='pending'),
        sa.Column('reimbursed', sa.Boolean(), nullable=True, default=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['carrier_id'], ['carriers.id']),
        sa.ForeignKeyConstraint(['load_id'], ['loads.id']),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id']),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id']),
        sa.ForeignKeyConstraint(['transponder_id'], ['toll_transponders.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_toll_transactions_carrier_id'), 'toll_transactions', ['carrier_id'], unique=False)
    
    # IFTA Reports table
    op.create_table('ifta_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('carrier_id', sa.Integer(), nullable=False),
        sa.Column('quarter', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True, default='draft'),
        sa.Column('total_miles', sa.Float(), nullable=True, default=0.0),
        sa.Column('total_gallons', sa.Float(), nullable=True, default=0.0),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['carrier_id'], ['carriers.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ifta_reports_carrier_id'), 'ifta_reports', ['carrier_id'], unique=False)
    
    # IFTA Entries table
    op.create_table('ifta_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=True),
        sa.Column('carrier_id', sa.Integer(), nullable=False),
        sa.Column('driver_id', sa.Integer(), nullable=True),
        sa.Column('equipment_id', sa.Integer(), nullable=True),
        sa.Column('jurisdiction', sa.String(length=2), nullable=False),
        sa.Column('entry_date', sa.DateTime(), nullable=False),
        sa.Column('miles', sa.Float(), nullable=False),
        sa.Column('gallons', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['report_id'], ['ifta_reports.id']),
        sa.ForeignKeyConstraint(['carrier_id'], ['carriers.id']),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id']),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ifta_entries_carrier_id'), 'ifta_entries', ['carrier_id'], unique=False)
    op.create_index(op.f('ix_ifta_entries_report_id'), 'ifta_entries', ['report_id'], unique=False)
    
    # Add vendor columns to expenses table
    with op.batch_alter_table('expenses', schema=None) as batch_op:
        batch_op.add_column(sa.Column('vendor_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('load_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('equipment_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('status', sa.String(length=50), nullable=True, server_default='pending'))
        batch_op.add_column(sa.Column('approved_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('approved_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_index(batch_op.f('ix_expenses_vendor_id'), ['vendor_id'], unique=False)
        batch_op.create_foreign_key('fk_expenses_vendor', 'vendors', ['vendor_id'], ['id'])
        batch_op.create_foreign_key('fk_expenses_load', 'loads', ['load_id'], ['id'])
        batch_op.create_foreign_key('fk_expenses_equipment', 'equipment', ['equipment_id'], ['id'])
        batch_op.create_foreign_key('fk_expenses_approved_by', 'users', ['approved_by'], ['id'])
    
    # Add vendor columns to maintenance table
    with op.batch_alter_table('maintenance', schema=None) as batch_op:
        batch_op.add_column(sa.Column('equipment_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('vendor_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('maintenance_type', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('odometer', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('scheduled_date', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('completed_date', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('status', sa.String(length=50), nullable=True, server_default='scheduled'))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_index(batch_op.f('ix_maintenance_vendor_id'), ['vendor_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_maintenance_equipment_id'), ['equipment_id'], unique=False)
        batch_op.create_foreign_key('fk_maintenance_vendor', 'vendors', ['vendor_id'], ['id'])
        batch_op.create_foreign_key('fk_maintenance_equipment', 'equipment', ['equipment_id'], ['id'])


def downgrade():
    # Drop added columns from maintenance
    with op.batch_alter_table('maintenance', schema=None) as batch_op:
        batch_op.drop_constraint('fk_maintenance_equipment', type_='foreignkey')
        batch_op.drop_constraint('fk_maintenance_vendor', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_maintenance_equipment_id'))
        batch_op.drop_index(batch_op.f('ix_maintenance_vendor_id'))
        batch_op.drop_column('updated_at')
        batch_op.drop_column('status')
        batch_op.drop_column('completed_date')
        batch_op.drop_column('scheduled_date')
        batch_op.drop_column('odometer')
        batch_op.drop_column('maintenance_type')
        batch_op.drop_column('vendor_id')
        batch_op.drop_column('equipment_id')
    
    # Drop added columns from expenses
    with op.batch_alter_table('expenses', schema=None) as batch_op:
        batch_op.drop_constraint('fk_expenses_approved_by', type_='foreignkey')
        batch_op.drop_constraint('fk_expenses_equipment', type_='foreignkey')
        batch_op.drop_constraint('fk_expenses_load', type_='foreignkey')
        batch_op.drop_constraint('fk_expenses_vendor', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_expenses_vendor_id'))
        batch_op.drop_column('updated_at')
        batch_op.drop_column('approved_at')
        batch_op.drop_column('approved_by')
        batch_op.drop_column('status')
        batch_op.drop_column('equipment_id')
        batch_op.drop_column('load_id')
        batch_op.drop_column('vendor_id')
    
    # Drop new tables
    op.drop_index(op.f('ix_ifta_entries_report_id'), table_name='ifta_entries')
    op.drop_index(op.f('ix_ifta_entries_carrier_id'), table_name='ifta_entries')
    op.drop_table('ifta_entries')
    
    op.drop_index(op.f('ix_ifta_reports_carrier_id'), table_name='ifta_reports')
    op.drop_table('ifta_reports')
    
    op.drop_index(op.f('ix_toll_transactions_carrier_id'), table_name='toll_transactions')
    op.drop_table('toll_transactions')
    
    op.drop_index(op.f('ix_toll_transponders_carrier_id'), table_name='toll_transponders')
    op.drop_table('toll_transponders')
    
    op.drop_index(op.f('ix_vendors_carrier_id'), table_name='vendors')
    op.drop_table('vendors')
    
    op.drop_index(op.f('ix_safety_scores_carrier_id'), table_name='safety_scores')
    op.drop_table('safety_scores')
    
    op.drop_index(op.f('ix_safety_events_carrier_id'), table_name='safety_events')
    op.drop_table('safety_events')
