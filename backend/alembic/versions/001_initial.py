"""Create initial schema.

Revision ID: 001
Revises:
Create Date: 2024-01-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Run migrations."""
    op.create_table(
        "carriers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("internal_code", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_carriers_internal_code", "carriers", ["internal_code"], unique=True)

    op.create_table(
        "drivers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("carrier_id", sa.Integer(), sa.ForeignKey("carriers.id"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_drivers_carrier_id", "drivers", ["carrier_id"])
    op.create_index("ix_drivers_email", "drivers", ["email"])

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("carrier_id", sa.Integer(), sa.ForeignKey("carriers.id"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("driver_id", sa.Integer(), sa.ForeignKey("drivers.id"), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_carrier_id", "users", ["carrier_id"])
    op.create_index("ix_users_driver_id", "users", ["driver_id"])

    op.create_table(
        "loads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("carrier_id", sa.Integer(), sa.ForeignKey("carriers.id"), nullable=False),
        sa.Column("driver_id", sa.Integer(), sa.ForeignKey("drivers.id"), nullable=True),
        sa.Column("load_number", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="Created"),
        sa.Column("pickup_address", sa.Text(), nullable=False),
        sa.Column("delivery_address", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_loads_carrier_id", "loads", ["carrier_id"])
    op.create_index("ix_loads_driver_id", "loads", ["driver_id"])

    op.create_table(
        "pods",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("load_id", sa.Integer(), sa.ForeignKey("loads.id"), nullable=False),
        sa.Column("uploaded_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("file_links", sa.JSON(), nullable=False),
        sa.Column("signature_link", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_pods_load_id", "pods", ["load_id"])

    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("carrier_id", sa.Integer(), sa.ForeignKey("carriers.id"), nullable=False),
        sa.Column("driver_id", sa.Integer(), sa.ForeignKey("drivers.id"), nullable=True),
        sa.Column("amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(), nullable=True),
        sa.Column("receipt_link", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_expenses_carrier_id", "expenses", ["carrier_id"])

    op.create_table(
        "maintenance",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("carrier_id", sa.Integer(), sa.ForeignKey("carriers.id"), nullable=False),
        sa.Column("unit", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cost", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("occurred_at", sa.DateTime(), nullable=True),
        sa.Column("receipt_link", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_maintenance_carrier_id", "maintenance", ["carrier_id"])


def downgrade() -> None:
    """Revert migrations."""
    op.drop_index("ix_maintenance_carrier_id", table_name="maintenance")
    op.drop_table("maintenance")
    op.drop_index("ix_expenses_carrier_id", table_name="expenses")
    op.drop_table("expenses")
    op.drop_index("ix_pods_load_id", table_name="pods")
    op.drop_table("pods")
    op.drop_index("ix_loads_driver_id", table_name="loads")
    op.drop_index("ix_loads_carrier_id", table_name="loads")
    op.drop_table("loads")
    op.drop_index("ix_users_driver_id", table_name="users")
    op.drop_index("ix_users_carrier_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_index("ix_drivers_email", table_name="drivers")
    op.drop_index("ix_drivers_carrier_id", table_name="drivers")
    op.drop_table("drivers")
    op.drop_index("ix_carriers_internal_code", table_name="carriers")
    op.drop_table("carriers")
