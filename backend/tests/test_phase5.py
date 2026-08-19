import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tank import Tank
from app.repositories.alert import AlertRepository
from app.repositories.tank import TankRepository
from app.schemas.alert import AlertCreate
from app.services.alert import AlertService


@pytest.mark.asyncio
async def test_alert_deduplication_and_cooldown(db_session: AsyncSession):
    """Verify that multiple consecutive breaches update the active alert rather than creating spam duplicates."""
    alert_repo = AlertRepository(db_session)
    alert_service = AlertService(alert_repo)

    # 1st breach: Low water level
    a1 = await alert_service.create_or_deduplicate_alert(
        AlertCreate(
            tank_id=1,
            alarm_code="LOW_WATER_LEVEL",
            type="Low Tank Level",
            title="Critical Low Water Level",
            message="Water level at 18.0%",
            severity="warning",
            source_node="ESP32_TANK_01",
        )
    )
    assert a1.id is not None
    initial_id = a1.id

    # 2nd breach: 1 second later with level at 17.5%
    a2 = await alert_service.create_or_deduplicate_alert(
        AlertCreate(
            tank_id=1,
            alarm_code="LOW_WATER_LEVEL",
            type="Low Tank Level",
            title="Critical Low Water Level",
            message="Water level at 17.5%",
            severity="warning",
            source_node="ESP32_TANK_01",
        )
    )

    # Must be the exact same alert row updated in-place
    assert a2.id == initial_id
    assert a2.message == "Water level at 17.5%"

    # Total unacknowledged alerts in repository must be exactly 1
    active_alerts = await alert_repo.get_active_alarms()
    assert len(active_alerts) == 1


@pytest.mark.asyncio
async def test_prototype_telemetry_triggers_multiple_alerts(db_session: AsyncSession):
    """Verify evaluate_prototype_telemetry triggers alerts for low water, leak, and high TDS."""
    alert_repo = AlertRepository(db_session)
    alert_service = AlertService(alert_repo)

    alerts = await alert_service.evaluate_prototype_telemetry(
        tank_id=1,
        water_level_pct=15.0,  # Trigger 1: Low water level
        flow_difference_lpm=2.5,
        possible_leak=True,     # Trigger 2: Differential leak
        tds_ppm=750.0,         # Trigger 3: High TDS
        turbidity_raw=1000,
        source_node="ESP32_TANK_01",
    )

    assert len(alerts) == 3
    alarm_codes = {a.alarm_code for a in alerts}
    assert "LOW_WATER_LEVEL" in alarm_codes
    assert "LEAK_DETECTED" in alarm_codes
    assert "HIGH_TDS" in alarm_codes


@pytest.mark.asyncio
async def test_alert_api_filtering_and_acknowledgment(client: AsyncClient, db_session: AsyncSession):
    """Verify GET /api/v1/alerts filtering and acknowledge endpoints."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "Benchtop Tank", "location": "Lab", "capacity": 20.0, "height_cm": 30.0}
    )

    alert_repo = AlertRepository(db_session)
    alert_service = AlertService(alert_repo)

    # Seed 2 alerts
    await alert_service.create_alert(
        AlertCreate(
            tank_id=tank.id,
            alarm_code="LEAK_DETECTED",
            type="Potential Leak",
            title="Leak in pipeline",
            message="Water loss 2.5 LPM",
            severity="critical",
            source_node="ESP32_TANK_01",
        )
    )
    await alert_service.create_alert(
        AlertCreate(
            tank_id=tank.id,
            alarm_code="HIGH_TURBIDITY",
            type="High Turbidity",
            title="Turbidity high",
            message="ADC 3500",
            severity="warning",
            source_node="ESP32_TANK_01",
        )
    )

    # 1. Fetch all alerts
    resp = await client.get("/api/v1/alerts")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 2

    # 2. Filter by severity=critical
    crit_resp = await client.get("/api/v1/alerts?severity=critical")
    assert crit_resp.status_code == 200
    assert len(crit_resp.json()["data"]) == 1
    assert crit_resp.json()["data"][0]["severity"] == "critical"

    # 3. Acknowledge single alert
    alert_id = resp.json()["data"][0]["id"]
    ack_resp = await client.post(f"/api/v1/alerts/{alert_id}/acknowledge")
    assert ack_resp.status_code == 200
    assert ack_resp.json()["data"]["acknowledged"] is True

    # 4. Bulk acknowledge remaining alerts
    bulk_ack = await client.post(f"/api/v1/alerts/acknowledge-all?tank_id={tank.id}")
    assert bulk_ack.status_code == 200
    assert bulk_ack.json()["data"]["acknowledged_count"] >= 1

    # 5. Verify 0 unacknowledged alerts remain
    active_resp = await client.get("/api/v1/alerts?acknowledged=false")
    assert active_resp.status_code == 200
    assert len(active_resp.json()["data"]) == 0
