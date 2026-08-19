"""Phase 3 Prototype Schema Sync: Update devices, tanks, sensor_readings, scada_alarms, tank_states, and predictions

Revision ID: 003_prototype_schema_sync
Revises: 002_phase2_iot_digital_twin
Create Date: 2026-08-17 16:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


revision: str = '003_prototype_schema_sync'
down_revision: Union[str, None] = '002_phase2_iot_digital_twin'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_tables = inspector.get_table_names()

    # -------------------------------------------------------------
    # 1. Update TANKS table
    # -------------------------------------------------------------
    if 'tanks' in existing_tables:
        tank_cols = [c['name'] for c in inspector.get_columns('tanks')]
        if 'height_cm' not in tank_cols:
            op.add_column('tanks', sa.Column('height_cm', sa.Float(), nullable=False, server_default='30.0'))
        if 'diameter_cm' not in tank_cols:
            op.add_column('tanks', sa.Column('diameter_cm', sa.Float(), nullable=True))
        if 'flow_1_calibration' not in tank_cols:
            op.add_column('tanks', sa.Column('flow_1_calibration', sa.Float(), nullable=False, server_default='7.5'))
        if 'flow_2_calibration' not in tank_cols:
            op.add_column('tanks', sa.Column('flow_2_calibration', sa.Float(), nullable=False, server_default='7.5'))

    # -------------------------------------------------------------
    # 2. Update DEVICES table
    # -------------------------------------------------------------
    if 'devices' in existing_tables:
        device_cols = [c['name'] for c in inspector.get_columns('devices')]
        
        # Add new columns (nullable initially for safe backfill)
        if 'device_id' not in device_cols:
            op.add_column('devices', sa.Column('device_id', sa.String(length=100), nullable=True))
        if 'device_name' not in device_cols:
            op.add_column('devices', sa.Column('device_name', sa.String(length=150), nullable=True))
        if 'device_type' not in device_cols:
            op.add_column('devices', sa.Column('device_type', sa.String(length=50), nullable=False, server_default='ESP32_CONTROLLER'))
        if 'wifi_rssi' not in device_cols:
            op.add_column('devices', sa.Column('wifi_rssi', sa.Integer(), nullable=False, server_default='-55'))

        # Backfill new columns from legacy columns if present
        if 'node_id' in device_cols:
            op.execute("UPDATE devices SET device_id = node_id WHERE device_id IS NULL;")
        else:
            op.execute("UPDATE devices SET device_id = 'DEVICE_' || id::text WHERE device_id IS NULL;")

        if 'node_name' in device_cols:
            op.execute("UPDATE devices SET device_name = node_name WHERE device_name IS NULL;")
        else:
            op.execute("UPDATE devices SET device_name = 'Device ' || id::text WHERE device_name IS NULL;")

        if 'signal_rssi' in device_cols:
            op.execute("UPDATE devices SET wifi_rssi = signal_rssi WHERE wifi_rssi IS NULL;")

        # Set NOT NULL and create index on device_id
        op.alter_column('devices', 'device_id', nullable=False)
        op.alter_column('devices', 'device_name', nullable=False)

        device_indexes = [idx['name'] for idx in inspector.get_indexes('devices')]
        if 'ix_devices_device_id' not in device_indexes:
            op.create_index(op.f('ix_devices_device_id'), 'devices', ['device_id'], unique=True)

        # Drop legacy indexes and columns
        if 'ix_devices_node_id' in device_indexes:
            op.drop_index('ix_devices_node_id', table_name='devices')
        
        for col_to_drop in ['node_id', 'node_name', 'node_type', 'battery_level', 'signal_rssi']:
            if col_to_drop in device_cols:
                op.drop_column('devices', col_to_drop)

    # -------------------------------------------------------------
    # 3. Update SENSOR_READINGS table
    # -------------------------------------------------------------
    if 'sensor_readings' in existing_tables:
        sr_cols = [c['name'] for c in inspector.get_columns('sensor_readings')]
        sr_fks = inspector.get_foreign_keys('sensor_readings')
        
        # Drop foreign key constraint on device_id if exists
        for fk in sr_fks:
            if fk.get('referred_table') == 'devices' and 'device_id' in fk.get('constrained_columns', []):
                op.drop_constraint(fk['name'], 'sensor_readings', type_='foreignkey')

        # Drop index on device_id if exists
        sr_indexes = [idx['name'] for idx in inspector.get_indexes('sensor_readings')]
        if 'ix_sensor_readings_device_id' in sr_indexes:
            op.drop_index('ix_sensor_readings_device_id', table_name='sensor_readings')

        # Convert device_id column to VARCHAR(100)
        op.alter_column(
            'sensor_readings',
            'device_id',
            type_=sa.String(length=100),
            postgresql_using="('ESP32_TANK_' || device_id::text)",
            nullable=False
        )
        op.create_index(op.f('ix_sensor_readings_device_id'), 'sensor_readings', ['device_id'], unique=False)

        # Add new columns
        if 'flow_1_lpm' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('flow_1_lpm', sa.Float(), nullable=False, server_default='0.0'))
        if 'flow_2_lpm' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('flow_2_lpm', sa.Float(), nullable=False, server_default='0.0'))
        if 'flow_1_total_liters' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('flow_1_total_liters', sa.Float(), nullable=False, server_default='0.0'))
        if 'flow_2_total_liters' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('flow_2_total_liters', sa.Float(), nullable=False, server_default='0.0'))
        if 'flow_difference_lpm' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('flow_difference_lpm', sa.Float(), nullable=False, server_default='0.0'))
        if 'estimated_water_loss_lpm' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('estimated_water_loss_lpm', sa.Float(), nullable=False, server_default='0.0'))
        if 'possible_leak' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('possible_leak', sa.Boolean(), nullable=False, server_default='false'))
        if 'turbidity_raw' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('turbidity_raw', sa.Integer(), nullable=False, server_default='1000'))
        if 'turbidity_status' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('turbidity_status', sa.String(length=50), nullable=False, server_default='Clear'))
        if 'wifi_rssi' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('wifi_rssi', sa.Integer(), nullable=False, server_default='-55'))
        if 'pump_status' not in sr_cols:
            op.add_column('sensor_readings', sa.Column('pump_status', sa.Boolean(), nullable=False, server_default='false'))

        # Backfill flow_1_lpm from flow_rate_lmin if present
        if 'flow_rate_lmin' in sr_cols:
            op.execute("UPDATE sensor_readings SET flow_1_lpm = flow_rate_lmin WHERE flow_1_lpm = 0.0;")

        # Drop legacy columns
        for col_to_drop in ['flow_rate_lmin', 'daily_consumption_liters', 'hourly_consumption_liters', 'turbidity_ntu', 'pressure_bar', 'ph_level']:
            if col_to_drop in sr_cols:
                op.drop_column('sensor_readings', col_to_drop)

    # -------------------------------------------------------------
    # 4. Update SCADA_ALARMS table
    # -------------------------------------------------------------
    if 'scada_alarms' in existing_tables:
        alarm_cols = [c['name'] for c in inspector.get_columns('scada_alarms')]
        if 'tank_id' not in alarm_cols:
            op.add_column('scada_alarms', sa.Column('tank_id', sa.Integer(), nullable=True))
            op.create_foreign_key('fk_scada_alarms_tank_id_tanks', 'scada_alarms', 'tanks', ['tank_id'], ['id'], ondelete='CASCADE')
            op.create_index(op.f('ix_scada_alarms_tank_id'), 'scada_alarms', ['tank_id'], unique=False)
        if 'type' not in alarm_cols:
            op.add_column('scada_alarms', sa.Column('type', sa.String(length=50), nullable=False, server_default='System'))
            op.create_index(op.f('ix_scada_alarms_type'), 'scada_alarms', ['type'], unique=False)

    # -------------------------------------------------------------
    # 5. Create TANK_STATES table if missing
    # -------------------------------------------------------------
    if 'tank_states' not in existing_tables:
        op.create_table(
            'tank_states',
            sa.Column('tank_id', sa.Integer(), nullable=False),
            sa.Column('water_level_percent', sa.Float(), nullable=False),
            sa.Column('distance_cm', sa.Float(), nullable=False),
            sa.Column('flow_in_lpm', sa.Float(), nullable=False),
            sa.Column('flow_out_lpm', sa.Float(), nullable=False),
            sa.Column('water_loss_lpm', sa.Float(), nullable=False),
            sa.Column('flow_1_total_liters', sa.Float(), nullable=False),
            sa.Column('flow_2_total_liters', sa.Float(), nullable=False),
            sa.Column('tds_ppm', sa.Float(), nullable=False),
            sa.Column('turbidity_raw', sa.Integer(), nullable=False),
            sa.Column('turbidity_status', sa.String(length=50), nullable=False),
            sa.Column('water_quality_status', sa.String(length=50), nullable=False),
            sa.Column('pump_status', sa.String(length=50), nullable=False),
            sa.Column('system_status', sa.String(length=50), nullable=False),
            sa.Column('leak_probability', sa.Float(), nullable=False),
            sa.Column('possible_leak', sa.Boolean(), nullable=False),
            sa.Column('last_telemetry_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['tank_id'], ['tanks.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('tank_id')
        )

    # -------------------------------------------------------------
    # 6. Create PREDICTIONS table if missing
    # -------------------------------------------------------------
    if 'predictions' not in existing_tables:
        op.create_table(
            'predictions',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('tank_id', sa.Integer(), nullable=False),
            sa.Column('model_name', sa.String(length=100), nullable=False),
            sa.Column('prediction_type', sa.String(length=50), nullable=False),
            sa.Column('predicted_value', sa.Float(), nullable=False),
            sa.Column('confidence', sa.Float(), nullable=False),
            sa.Column('features_snapshot', sa.Text(), nullable=True),
            sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['tank_id'], ['tanks.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_predictions_id'), 'predictions', ['id'], unique=False)
        op.create_index(op.f('ix_predictions_model_name'), 'predictions', ['model_name'], unique=False)
        op.create_index(op.f('ix_predictions_prediction_type'), 'predictions', ['prediction_type'], unique=False)
        op.create_index(op.f('ix_predictions_tank_id'), 'predictions', ['tank_id'], unique=False)
        op.create_index(op.f('ix_predictions_timestamp'), 'predictions', ['timestamp'], unique=False)

    # -------------------------------------------------------------
    # 7. Synchronize sequence and ensure 'ESP32_001' device exists
    # -------------------------------------------------------------
    op.execute("SELECT setval(pg_get_serial_sequence('devices', 'id'), COALESCE((SELECT MAX(id) FROM devices), 1));")
    
    op.execute("UPDATE devices SET device_id = 'ESP32_001', device_name = 'Node-RED / ESP32 Controller 01' WHERE id = 1;")
    
    op.execute("""
        INSERT INTO devices (device_id, device_name, device_type, protocol, location, firmware_version, wifi_rssi, status, last_seen, tank_id, created_at, updated_at)
        SELECT 'ESP32_001', 'Node-RED / ESP32 Controller 01', 'ESP32_CONTROLLER', 'WiFi', 'Benchtop Prototype', '0.1.0', -55, 'Online', NOW(), 1, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM devices WHERE device_id = 'ESP32_001');
    """)


def downgrade() -> None:
    pass
