from datetime import datetime, timezone
from typing import List, Optional
from app.core.exceptions import NotFoundException
from app.models.sensor_reading import SensorReading
from app.repositories.device import DeviceRepository
from app.repositories.sensor_reading import SensorReadingRepository
from app.repositories.tank import TankRepository
from app.schemas.sensor_data import FrontendTelemetryPayload, SensorDataIngest, SensorReadingResponse
from app.services.alert import AlertService
from app.websocket.manager import connection_manager


class SensorDataService:
    """Service layer for IoT Sensor telemetry ingestion and real-time distribution."""

    def __init__(
        self,
        sensor_repo: SensorReadingRepository,
        device_repo: DeviceRepository,
        tank_repo: TankRepository,
        alert_service: AlertService,
    ):
        self.sensor_repo = sensor_repo
        self.device_repo = device_repo
        self.tank_repo = tank_repo
        self.alert_service = alert_service

    async def ingest_sensor_data(self, data_in: SensorDataIngest) -> SensorReading:
        """Ingest, validate, store sensor data and trigger real-time digital twin & WebSocket events."""
        # 1. Verify device registration
        device = await self.device_repo.get(data_in.device_id)
        if not device:
            raise NotFoundException(f"Device with ID {data_in.device_id} not registered")

        # 2. Verify tank
        tank = await self.tank_repo.get(data_in.tank_id)
        if not tank:
            raise NotFoundException(f"Tank with ID {data_in.tank_id} not found")

        # 3. Classify Water Quality (Safe: TDS < 500 PPM & pH 6.5-8.5)
        is_safe = data_in.tds_ppm <= 500.0 and 6.5 <= data_in.ph_level <= 8.5
        quality_status = "Safe" if is_safe else "Unsafe"

        # 4. Calculate Leak Index from pressure & flow discrepancy
        leak_index = 0.08
        if data_in.pressure_bar > 5.0 and data_in.flow_rate_lmin > 80.0:
            leak_index = 0.65
        elif data_in.pressure_bar < 2.0:
            leak_index = 0.45

        # 5. Save Sensor Reading
        reading_dict = data_in.model_dump()
        reading_dict["water_quality_status"] = quality_status
        reading_dict["leak_probability"] = leak_index
        reading_dict["timestamp"] = datetime.now(timezone.utc)

        reading = await self.sensor_repo.create(reading_dict)

        # 6. Update device status and last_seen
        device.last_seen = datetime.now(timezone.utc)
        device.status = "Online"
        await self.device_repo.update(device, {"last_seen": device.last_seen, "status": "Online"})

        # 7. Evaluate automated alert rules
        await self.alert_service.evaluate_sensor_data(
            water_level_pct=data_in.water_level_pct,
            tds_ppm=data_in.tds_ppm,
            ph_level=data_in.ph_level,
            leak_probability=leak_index,
            node_name=device.node_name,
        )

        # 8. Broadcast real-time WebSocket telemetry update matching frontend Zustand store
        telemetry_payload = FrontendTelemetryPayload(
            timestamp=datetime.now(timezone.utc).toISOString() if hasattr(datetime.now(timezone.utc), 'toISOString') else datetime.now(timezone.utc).isoformat(),
            pressure=data_in.pressure_bar,
            flowRate=data_in.flow_rate_lmin,
            tankLevel=data_in.water_level_pct,
            tankCapacityLiters=tank.capacity,
            pumpStatus="running" if data_in.flow_rate_lmin > 0 else "stopped",
            pumpRPM=1450 if data_in.flow_rate_lmin > 0 else 0,
            dailyConsumptionLiters=data_in.daily_consumption_liters or 18450.0,
            hourlyConsumptionLiters=data_in.hourly_consumption_liters or 1250.0,
            leakProbability=leak_index,
            pumpHealthScore=94,
            valveStatus="OPEN" if data_in.flow_rate_lmin > 0 else "CLOSED",
            waterTurbidityNTU=data_in.turbidity_ntu,
            pHLevel=data_in.ph_level,
        )

        await connection_manager.broadcast_all(
            {
                "event": "telemetry_update",
                "data": telemetry_payload.model_dump(),
            }
        )

        return reading

    async def get_latest_telemetry(self) -> FrontendTelemetryPayload:
        """Fetch latest telemetry payload matching frontend Zustand store."""
        reading = await self.sensor_repo.get_latest()
        if not reading:
            # Fallback initial telemetry if database is fresh
            return FrontendTelemetryPayload(
                timestamp=datetime.now(timezone.utc).isoformat(),
                pressure=3.8,
                flowRate=42.6,
                tankLevel=72.0,
                tankCapacityLiters=50000.0,
                pumpStatus="running",
                pumpRPM=1450,
                dailyConsumptionLiters=18450.0,
                hourlyConsumptionLiters=1250.0,
                leakProbability=0.08,
                pumpHealthScore=94,
                valveStatus="OPEN",
                waterTurbidityNTU=0.4,
                pHLevel=7.2,
            )

        tank = await self.tank_repo.get(reading.tank_id)
        capacity = tank.capacity if tank else 50000.0

        return FrontendTelemetryPayload(
            timestamp=reading.timestamp.isoformat(),
            pressure=reading.pressure_bar,
            flowRate=reading.flow_rate_lmin,
            tankLevel=reading.water_level_pct,
            tankCapacityLiters=capacity,
            pumpStatus="running" if reading.flow_rate_lmin > 0 else "stopped",
            pumpRPM=1450 if reading.flow_rate_lmin > 0 else 0,
            dailyConsumptionLiters=reading.daily_consumption_liters,
            hourlyConsumptionLiters=reading.hourly_consumption_liters,
            leakProbability=reading.leak_probability,
            pumpHealthScore=94,
            valveStatus="OPEN" if reading.flow_rate_lmin > 0 else "CLOSED",
            waterTurbidityNTU=reading.turbidity_ntu,
            pHLevel=reading.ph_level,
        )

    async def get_history_by_tank(self, tank_id: int, limit: int = 100) -> List[SensorReadingResponse]:
        """Fetch historical sensor readings for a tank."""
        readings = await self.sensor_repo.get_history_by_tank(tank_id, limit=limit)
        return [SensorReadingResponse.model_validate(r) for r in readings]
