"""payroll payees ledgers

Revision ID: 7c0f7e8a9a1b
Revises: 42c2a2f9d8b1
Create Date: 2026-02-03 13:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "7c0f7e8a9a1b"
down_revision = "42c2a2f9d8b1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("loads", sa.Column("broker_name", sa.String(length=200), nullable=True))
    op.add_column("loads", sa.Column("po_number", sa.String(length=100), nullable=True))
    op.add_column("loads", sa.Column("rate_amount", sa.Float(), nullable=True))

    op.create_table(
        "payees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("carrier_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("payee_type", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["carrier_id"], ["carriers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payees_id", "payees", ["id"], unique=False)
    op.create_index("ix_payees_carrier_id", "payees", ["carrier_id"], unique=False)

    op.add_column("drivers", sa.Column("payee_id", sa.Integer(), nullable=True))
    op.create_index("ix_drivers_payee_id", "drivers", ["payee_id"], unique=False)
    op.create_foreign_key("fk_drivers_payee_id", "drivers", "payees", ["payee_id"], ["id"])

    op.create_table(
        "driver_pay_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("pay_type", sa.String(length=50), nullable=False),
        sa.Column("rate", sa.Float(), nullable=False),
        sa.Column("driver_kind", sa.String(length=50), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_driver_pay_profiles_id", "driver_pay_profiles", ["id"], unique=False)
    op.create_index("ix_driver_pay_profiles_driver_id", "driver_pay_profiles", ["driver_id"], unique=False)

    op.create_table(
        "driver_additional_payees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("payee_id", sa.Integer(), nullable=False),
        sa.Column("pay_rate_percent", sa.Float(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"]),
        sa.ForeignKeyConstraint(["payee_id"], ["payees.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_driver_additional_payees_id", "driver_additional_payees", ["id"], unique=False)
    op.create_index("ix_driver_additional_payees_driver_id", "driver_additional_payees", ["driver_id"], unique=False)
    op.create_index("ix_driver_additional_payees_payee_id", "driver_additional_payees", ["payee_id"], unique=False)

    op.create_table(
        "driver_documents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("doc_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("issued_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("attachment_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_driver_documents_id", "driver_documents", ["id"], unique=False)
    op.create_index("ix_driver_documents_driver_id", "driver_documents", ["driver_id"], unique=False)

    op.create_table(
        "recurring_settlement_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("payee_id", sa.Integer(), nullable=False),
        sa.Column("item_type", sa.String(length=50), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("schedule", sa.String(length=50), nullable=False),
        sa.Column("next_date", sa.DateTime(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("description", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"]),
        sa.ForeignKeyConstraint(["payee_id"], ["payees.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recurring_settlement_items_id", "recurring_settlement_items", ["id"], unique=False)

    op.create_table(
        "load_stops",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("load_id", sa.Integer(), nullable=False),
        sa.Column("stop_type", sa.String(length=20), nullable=False),
        sa.Column("company", sa.String(length=200), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=20), nullable=True),
        sa.Column("date", sa.String(length=20), nullable=True),
        sa.Column("time", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["load_id"], ["loads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_load_stops_id", "load_stops", ["id"], unique=False)
    op.create_index("ix_load_stops_load_id", "load_stops", ["load_id"], unique=False)

    op.create_table(
        "load_charges",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("load_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=200), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["load_id"], ["loads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_load_charges_id", "load_charges", ["id"], unique=False)
    op.create_index("ix_load_charges_load_id", "load_charges", ["load_id"], unique=False)

    op.create_table(
        "payroll_settlements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("payee_id", sa.Integer(), nullable=False),
        sa.Column("period_start", sa.DateTime(), nullable=False),
        sa.Column("period_end", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("exported_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["payee_id"], ["payees.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payroll_settlements_id", "payroll_settlements", ["id"], unique=False)

    op.create_table(
        "settlement_ledger_lines",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("load_id", sa.Integer(), nullable=True),
        sa.Column("payee_id", sa.Integer(), nullable=False),
        sa.Column("settlement_id", sa.Integer(), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=300), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("locked_at", sa.DateTime(), nullable=True),
        sa.Column("locked_reason", sa.String(length=50), nullable=True),
        sa.Column("voided_at", sa.DateTime(), nullable=True),
        sa.Column("replaces_line_id", sa.Integer(), nullable=True),
        sa.Column("adjustment_group_id", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["load_id"], ["loads.id"]),
        sa.ForeignKeyConstraint(["payee_id"], ["payees.id"]),
        sa.ForeignKeyConstraint(["settlement_id"], ["payroll_settlements.id"]),
        sa.ForeignKeyConstraint(["replaces_line_id"], ["settlement_ledger_lines.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_settlement_ledger_lines_id", "settlement_ledger_lines", ["id"], unique=False)
    op.create_index("ix_settlement_ledger_lines_load_id", "settlement_ledger_lines", ["load_id"], unique=False)
    op.create_index("ix_settlement_ledger_lines_payee_id", "settlement_ledger_lines", ["payee_id"], unique=False)


def downgrade():
    op.drop_index("ix_settlement_ledger_lines_payee_id", table_name="settlement_ledger_lines")
    op.drop_index("ix_settlement_ledger_lines_load_id", table_name="settlement_ledger_lines")
    op.drop_index("ix_settlement_ledger_lines_id", table_name="settlement_ledger_lines")
    op.drop_table("settlement_ledger_lines")
    op.drop_index("ix_payroll_settlements_id", table_name="payroll_settlements")
    op.drop_table("payroll_settlements")
    op.drop_index("ix_load_charges_load_id", table_name="load_charges")
    op.drop_index("ix_load_charges_id", table_name="load_charges")
    op.drop_table("load_charges")
    op.drop_index("ix_load_stops_load_id", table_name="load_stops")
    op.drop_index("ix_load_stops_id", table_name="load_stops")
    op.drop_table("load_stops")
    op.drop_index("ix_recurring_settlement_items_id", table_name="recurring_settlement_items")
    op.drop_table("recurring_settlement_items")
    op.drop_index("ix_driver_documents_driver_id", table_name="driver_documents")
    op.drop_index("ix_driver_documents_id", table_name="driver_documents")
    op.drop_table("driver_documents")
    op.drop_index("ix_driver_additional_payees_payee_id", table_name="driver_additional_payees")
    op.drop_index("ix_driver_additional_payees_driver_id", table_name="driver_additional_payees")
    op.drop_index("ix_driver_additional_payees_id", table_name="driver_additional_payees")
    op.drop_table("driver_additional_payees")
    op.drop_index("ix_driver_pay_profiles_driver_id", table_name="driver_pay_profiles")
    op.drop_index("ix_driver_pay_profiles_id", table_name="driver_pay_profiles")
    op.drop_table("driver_pay_profiles")
    op.drop_index("ix_payees_carrier_id", table_name="payees")
    op.drop_index("ix_payees_id", table_name="payees")
    op.drop_table("payees")
    op.drop_index("ix_drivers_payee_id", table_name="drivers")
    op.drop_constraint("fk_drivers_payee_id", "drivers", type_="foreignkey")
    op.drop_column("drivers", "payee_id")
    op.drop_column("loads", "rate_amount")
    op.drop_column("loads", "po_number")
    op.drop_column("loads", "broker_name")
