"""add mapbox and broker fields

Revision ID: add_mapbox_broker_fields
Revises: f38d10b04471
Create Date: 2026-02-03

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_mapbox_broker_fields'
down_revision = 'f38d10b04471'
branch_labels = None
depends_on = None


def upgrade():
    # Add new broker verification fields to loads table
    op.add_column('loads', sa.Column('broker_mc', sa.String(50), nullable=True))
    op.add_column('loads', sa.Column('broker_dot', sa.String(50), nullable=True))
    op.add_column('loads', sa.Column('broker_verified', sa.Boolean(), nullable=True, default=False))
    op.add_column('loads', sa.Column('broker_verified_at', sa.DateTime(), nullable=True))
    op.add_column('loads', sa.Column('total_miles', sa.Float(), nullable=True))
    op.add_column('loads', sa.Column('rate_per_mile', sa.Float(), nullable=True))
    
    # Add new location and mileage fields to load_stops table
    op.add_column('load_stops', sa.Column('stop_number', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('load_stops', sa.Column('address', sa.Text(), nullable=True))
    op.add_column('load_stops', sa.Column('zip_code', sa.String(20), nullable=True))
    op.add_column('load_stops', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('load_stops', sa.Column('longitude', sa.Float(), nullable=True))
    op.add_column('load_stops', sa.Column('miles_to_next_stop', sa.Float(), nullable=True))


def downgrade():
    # Remove columns from loads table
    op.drop_column('loads', 'broker_mc')
    op.drop_column('loads', 'broker_dot')
    op.drop_column('loads', 'broker_verified')
    op.drop_column('loads', 'broker_verified_at')
    op.drop_column('loads', 'total_miles')
    op.drop_column('loads', 'rate_per_mile')
    
    # Remove columns from load_stops table
    op.drop_column('load_stops', 'stop_number')
    op.drop_column('load_stops', 'address')
    op.drop_column('load_stops', 'zip_code')
    op.drop_column('load_stops', 'latitude')
    op.drop_column('load_stops', 'longitude')
    op.drop_column('load_stops', 'miles_to_next_stop')
