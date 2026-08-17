"""Phase 2 IoT Sensor Data, Devices, Digital Twin & Alerts Schema

Revision ID: 002_phase2_iot_digital_twin
Revises: 001_initial_schema
Create Date: 2026-08-12 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '002_phase2_iot_digital_twin'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Devices Table
    op.create_table(
        'devices',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('node_id', sa.String(length=100), nullable=False),
        sa.Column('node_name', sa.String(length=150), nullable=False),
        sa.Column('node_type', sa.String(length=50), nullable=False),
        sa.Column('protocol', sa.String(length=50), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('firmware_version', sa.String(length=50), nullable=False),
        sa.Column('battery_level', sa.Float(), nullable=False),
        sa.Column('signal_rssi', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('last_seen', sa.DateTime(timezone=True), nullable=False),
        sa.Column('tank_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tank_id'], ['tanks.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_devices_id'), 'devices', ['id'], unique=False)
    op.create_index(op.f('ix_devices_node_id'), 'devices', ['node_id'], unique=True)
    op.create_index(op.f('ix_devices_tank_id'), 'devices', ['tank_id'], unique=False)

    # 2. Sensor Readings Table
    op.create_table(
        'sensor_readings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False),
        sa.Column('tank_id', sa.Integer(), nullable=False),
        sa.Column('distance_cm', sa.Float(), nullable=False),
        sa.Column('water_level_pct', sa.Float(), nullable=False),
        sa.Column('flow_rate_lmin', sa.Float(), nullable=False),
        sa.Column('daily_consumption_liters', sa.Float(), nullable=False),
        sa.Column('hourly_consumption_liters', sa.Float(), nullable=False),
        sa.Column('tds_ppm', sa.Float(), nullable=False),
        sa.Column('ph_level', sa.Float(), nullable=False),
        sa.Column('turbidity_ntu', sa.Float(), nullable=False),
        sa.Column('water_quality_status', sa.String(length=50), nullable=False),
        sa.Column('pressure_bar', sa.Float(), nullable=False),
        sa.Column('leak_probability', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tank_id'], ['tanks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sensor_readings_device_id'), 'sensor_readings', ['device_id'], unique=False)
    op.create_index(op.f('ix_sensor_readings_id'), 'sensor_readings', ['id'], unique=False)
    op.create_index(op.f('ix_sensor_readings_tank_id'), 'sensor_readings', ['tank_id'], unique=False)
    op.create_index(op.f('ix_sensor_readings_timestamp'), 'sensor_readings', ['timestamp'], unique=False)

    # 3. SCADA Alarms Table
    op.create_table(
        'scada_alarms',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('alarm_code', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=False),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('source_node', sa.String(length=100), nullable=False),
        sa.Column('acknowledged', sa.Boolean(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_scada_alarms_alarm_code'), 'scada_alarms', ['alarm_code'], unique=False)
    op.create_index(op.f('ix_scada_alarms_id'), 'scada_alarms', ['id'], unique=False)
    op.create_index(op.f('ix_scada_alarms_timestamp'), 'scada_alarms', ['timestamp'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_scada_alarms_timestamp'), table_name='scada_alarms')
    op.drop_index(op.f('ix_scada_alarms_id'), table_name='scada_alarms')
    op.drop_index(op.f('ix_scada_alarms_alarm_code'), table_name='scada_alarms')
    op.drop_table('scada_alarms')

    op.drop_index(op.f('ix_sensor_readings_timestamp'), table_name='sensor_readings')
    op.drop_index(op.f('ix_sensor_readings_tank_id'), table_name='sensor_readings')
    op.drop_index(op.f('ix_sensor_readings_id'), table_name='sensor_readings')
    op.drop_index(op.f('ix_sensor_readings_device_id'), table_name='sensor_readings')
    op.drop_table('sensor_readings')

    op.drop_index(op.f('ix_devices_tank_id'), table_name='devices')
    op.drop_index(op.f('ix_devices_node_id'), table_name='devices')
    op.drop_index(op.f('ix_devices_id'), table_name='devices')
    op.drop_table('devices')
