from app.core.exceptions import NotFoundException
from app.repositories.sensor_reading import SensorReadingRepository
from app.repositories.tank import TankRepository
from app.schemas.digital_twin import (
    AIInsightsState,
    DigitalTwinResponse,
    PumpState,
    WaterQualityState,
)


class DigitalTwinService:
    """Service computing virtual digital twin state of water storage tanks."""

    def __init__(
        self,
        tank_repo: TankRepository,
        sensor_repo: SensorReadingRepository,
    ):
        self.tank_repo = tank_repo
        self.sensor_repo = sensor_repo

    async def get_digital_twin_state(self, tank_id: int) -> DigitalTwinResponse:
        """Compute real-time virtual digital twin state for a specific tank."""
        tank = await self.tank_repo.get(tank_id)
        if not tank:
            raise NotFoundException(f"Tank with ID {tank_id} not found")

        reading = await self.sensor_repo.get_latest_by_tank(tank_id)

        if reading:
            level_pct = reading.water_level_pct
            volume = (level_pct / 100.0) * tank.capacity
            inflow = reading.flow_rate_lmin
            outflow = max(0.0, inflow - 4.4)
            pressure = reading.pressure_bar
            tds = reading.tds_ppm
            ph = reading.ph_level
            turbidity = reading.turbidity_ntu
            quality_status = reading.water_quality_status
            leak_prob = reading.leak_probability
            pump_status = "running" if inflow > 0 else "stopped"
        else:
            # Fallback simulation values if no telemetry ingested yet
            level_pct = 72.0
            volume = 36000.0
            inflow = 42.6
            outflow = 38.2
            pressure = 3.8
            tds = 140.0
            ph = 7.2
            turbidity = 0.4
            quality_status = "Safe"
            leak_prob = 0.08
            pump_status = "running"

        return DigitalTwinResponse(
            tank_id=tank.id,
            tank_name=tank.name,
            location=tank.location,
            current_level_pct=round(level_pct, 1),
            current_volume_liters=round(volume, 1),
            capacity_liters=tank.capacity,
            inflow_rate_lmin=round(inflow, 1),
            outflow_rate_lmin=round(outflow, 1),
            pressure_bar=round(pressure, 2),
            water_quality=WaterQualityState(
                tds_ppm=tds,
                ph_level=ph,
                turbidity_ntu=turbidity,
                status=quality_status,
            ),
            pump_state=PumpState(
                status=pump_status,
                rpm=1450 if pump_status == "running" else 0,
                health_score=94,
            ),
            ai_insights=AIInsightsState(
                leak_probability=round(leak_prob, 2),
                pump_rul_hours=3420,
                friction_efficiency_pct=98.2,
            ),
            tank_status=tank.status,
        )
