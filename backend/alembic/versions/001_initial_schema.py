"""Initial schema migration: Users, Tanks, SensorNodes

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-12 14:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
# pyrefly: ignore [missing-import]
import sqlalchemy as sa


revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users Table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. Tanks Table
    op.create_table(
        'tanks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('capacity', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tanks_id'), 'tanks', ['id'], unique=False)
    op.create_index(op.f('ix_tanks_name'), 'tanks', ['name'], unique=False)

    # 3. SensorNodes Table
    op.create_table(
        'sensor_nodes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('tank_id', sa.Integer(), nullable=False),
        sa.Column('node_name', sa.String(length=150), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tank_id'], ['tanks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sensor_nodes_id'), 'sensor_nodes', ['id'], unique=False)
    op.create_index(op.f('ix_sensor_nodes_tank_id'), 'sensor_nodes', ['tank_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_sensor_nodes_tank_id'), table_name='sensor_nodes')
    op.drop_index(op.f('ix_sensor_nodes_id'), table_name='sensor_nodes')
    op.drop_table('sensor_nodes')

    op.drop_index(op.f('ix_tanks_name'), table_name='tanks')
    op.drop_index(op.f('ix_tanks_id'), table_name='tanks')
    op.drop_table('tanks')

    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
