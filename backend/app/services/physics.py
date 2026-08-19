from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger


class PhysicsService:
    """Physics Computation & Telemetry Evaluation Engine for Benchtop Prototype."""

    def __init__(self):
        # In-memory consecutive breach counters per tank_id: {tank_id: breach_count}
        self._leak_consecutive_counts: Dict[int, int] = {}

    def calculate_water_level(
        self,
        distance_cm: float,
        tank_height_cm: Optional[float] = None,
        capacity_liters: Optional[float] = None,
    ) -> Dict[str, float]:
        """Convert HC-SR04 ultrasonic measured distance into water height, percentage, and volume."""
        height = tank_height_cm or settings.DEFAULT_TANK_HEIGHT_CM
        capacity = capacity_liters or settings.DEFAULT_TANK_CAPACITY_LITERS

        water_height = max(0.0, height - distance_cm)
        level_pct = min(100.0, max(0.0, (water_height / height) * 100.0))
        current_volume = round(capacity * (level_pct / 100.0), 2)

        return {
            "distance_cm": round(distance_cm, 2),
            "water_height_cm": round(water_height, 2),
            "water_level_percent": round(level_pct, 2),
            "current_volume_liters": current_volume,
        }

    def calculate_differential_flow(
        self,
        flow_1_lpm: float,
        flow_2_lpm: float,
    ) -> Dict[str, float]:
        """Calculate differential flow and estimated non-negative water loss."""
        diff = round(flow_1_lpm - flow_2_lpm, 3)
        water_loss = max(0.0, diff)
        return {
            "flow_1_lpm": round(flow_1_lpm, 2),
            "flow_2_lpm": round(flow_2_lpm, 2),
            "flow_difference_lpm": diff,
            "estimated_water_loss_lpm": round(water_loss, 2),
        }

    def evaluate_stateful_leak(
        self,
        tank_id: int,
        flow_1_lpm: float,
        flow_2_lpm: float,
        pump_status: bool,
    ) -> Dict[str, Any]:
        """Stateful leak evaluator requiring minimum flow, differential threshold, and consecutive persistence."""
        diff = flow_1_lpm - flow_2_lpm
        min_flow = settings.LEAK_MINIMUM_FLOW_LPM
        diff_threshold = settings.LEAK_DIFFERENTIAL_THRESHOLD_LPM
        consecutive_required = settings.LEAK_CONSECUTIVE_READINGS_THRESHOLD

        current_count = self._leak_consecutive_counts.get(tank_id, 0)

        # Leak condition: pump is active (or positive upstream flow), flow > min_flow, and delta > threshold
        is_breaching = (pump_status or flow_1_lpm >= min_flow) and (diff >= diff_threshold) and (flow_1_lpm >= min_flow)

        if is_breaching:
            current_count += 1
        else:
            current_count = max(0, current_count - 1)

        self._leak_consecutive_counts[tank_id] = current_count

        possible_leak = current_count >= consecutive_required

        # Calculate leak probability index (0.0 to 1.0)
        if possible_leak:
            severity_factor = min(0.3, max(0.05, (diff - diff_threshold) / 10.0))
            leak_probability = min(1.0, 0.70 + severity_factor)
        elif current_count > 0:
            leak_probability = round((current_count / consecutive_required) * 0.40, 2)
        else:
            leak_probability = 0.02

        return {
            "possible_leak": possible_leak,
            "leak_probability": round(leak_probability, 2),
            "consecutive_breaches": current_count,
        }

    def reset_leak_state(self, tank_id: int) -> None:
        """Reset consecutive leak breach state for a tank."""
        self._leak_consecutive_counts[tank_id] = 0

    def classify_water_quality(
        self,
        tds_ppm: float,
        turbidity_raw: int,
    ) -> Dict[str, str]:
        """Classify TDS ppm and raw turbidity ADC readings according to configured indicator bands."""
        # TDS Classification
        if tds_ppm <= settings.TDS_THRESHOLD_GOOD_PPM:
            tds_status = "Good"
        elif tds_ppm <= settings.TDS_THRESHOLD_MONITOR_PPM:
            tds_status = "Monitor"
        else:
            tds_status = "High"

        # Turbidity Classification
        if turbidity_raw <= settings.TURBIDITY_THRESHOLD_CLEAR_RAW:
            turbidity_status = "Clear"
        elif turbidity_raw <= settings.TURBIDITY_THRESHOLD_MODERATE_RAW:
            turbidity_status = "Moderate"
        else:
            turbidity_status = "High"

        # Overall Water Quality
        if tds_status == "High" or turbidity_status == "High":
            overall_status = "High"
        elif tds_status == "Monitor" or turbidity_status == "Moderate":
            overall_status = "Monitor"
        else:
            overall_status = "Good"

        return {
            "tds_status": tds_status,
            "turbidity_status": turbidity_status,
            "water_quality_status": overall_status,
        }

    def evaluate_system_status(
        self,
        water_level_pct: float,
        possible_leak: bool,
        water_quality_status: str,
    ) -> str:
        """Determine overall system operational health status (Optimal, Warning, Critical)."""
        if possible_leak or water_level_pct < 15.0 or water_quality_status == "High":
            return "Critical" if (possible_leak and water_level_pct < 20.0) else "Warning"
        if water_quality_status == "Monitor" or water_level_pct < 30.0:
            return "Warning"
        return "Optimal"


physics_service = PhysicsService()
