from datetime import datetime, timezone
from typing import Optional
from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.repositories.tank import TankRepository
from app.repositories.tank_state import TankStateRepository
from app.schemas.digital_twin import (
    AIInsightsState,
    DigitalTwinResponse,
    DigitalTwinStateResponse,
    PumpState,
    WaterQualityState,
)


class DigitalTwinService:
    """Service serving real-time virtual digital twin models from TANK_STATE (Section 13 & 14)."""

    def __init__(
        self,
        tank_repo: TankRepository,
        tank_state_repo: TankStateRepository,
    ):
        self.tank_repo = tank_repo
        self.tank_state_repo = tank_state_repo

    async def get_digital_twin_state(self, tank_id: int) -> DigitalTwinStateResponse:
        """Fetch zero-latency live Digital Twin state directly from singleton TANK_STATE table."""
        tank = await self.tank_repo.get(tank_id)
        if not tank:
            raise NotFoundException(f"Tank with ID {tank_id} not found")

        state = await self.tank_state_repo.get_by_tank(tank_id)

        now_utc = datetime.now(timezone.utc)

        if state:
            level_pct = state.water_level_percent
            volume = round(tank.capacity * (level_pct / 100.0), 2)
            distance = state.distance_cm
            flow_in = state.flow_in_lpm
            flow_out = state.flow_out_lpm
            water_loss = state.water_loss_lpm
            flow_1_total = state.flow_1_total_liters
            flow_2_total = state.flow_2_total_liters
            tds = state.tds_ppm
            turbidity_raw = state.turbidity_raw
            turbidity = state.turbidity_status
            wq_status = state.water_quality_status
            pump = state.pump_status
            sys_status = state.system_status
            leak_prob = state.leak_probability
            possible_leak = state.possible_leak
            last_updated = state.last_telemetry_at or now_utc
        else:
            # Baseline state if no telemetry ingested yet
            level_pct = 80.0
            volume = round(tank.capacity * 0.8, 2)
            distance = round(tank.height_cm * 0.2, 2)
            flow_in = 0.0
            flow_out = 0.0
            water_loss = 0.0
            flow_1_total = 0.0
            flow_2_total = 0.0
            tds = 120.0
            turbidity_raw = 1000
            turbidity = "Clear"
            wq_status = "Good"
            pump = "OFF"
            sys_status = "Optimal"
            leak_prob = 0.0
            possible_leak = False
            last_updated = now_utc

        return DigitalTwinStateResponse(
            tank_id=tank.id,
            tank_name=tank.name,
            location=tank.location,
            tank_level_percent=round(level_pct, 1),
            distance_cm=round(distance, 1),
            capacity_liters=tank.capacity,
            current_volume_liters=volume,
            flow_in=round(flow_in, 2),
            flow_out=round(flow_out, 2),
            water_loss=round(water_loss, 2),
            flow_1_total_liters=round(flow_1_total, 2),
            flow_2_total_liters=round(flow_2_total, 2),
            tds=round(tds, 1),
            turbidity=turbidity,
            turbidity_raw=turbidity_raw,
            water_quality_status=wq_status,
            pump=pump,
            system_status=sys_status,
            leak_probability=round(leak_prob, 2),
            possible_leak=possible_leak,
            last_updated=last_updated,
        )
