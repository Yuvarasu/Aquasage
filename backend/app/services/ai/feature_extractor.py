import math
from typing import Dict, List, Any
from app.models.sensor_reading import SensorReading


class FeatureExtractor:
    """Extracts mathematical and statistical feature vectors from time-series IoT readings."""

    @staticmethod
    def extract_leak_features(readings: List[SensorReading]) -> Dict[str, Any]:
        """Extract rolling window statistical features for leak probability prediction."""
        if not readings:
            return {
                "sample_count": 0,
                "mean_flow_diff": 0.0,
                "std_flow_diff": 0.0,
                "max_flow_diff": 0.0,
                "flow_ratio": 1.0,
                "level_decay_rate": 0.0,
                "pump_duty_cycle": 0.0,
            }

        diffs = [r.flow_difference_lpm for r in readings]
        f1_vals = [r.flow_1_lpm for r in readings]
        f2_vals = [r.flow_2_lpm for r in readings]
        pumps = [1 if r.pump_status else 0 for r in readings]

        n = len(diffs)
        mean_diff = sum(diffs) / n
        variance = sum((x - mean_diff) ** 2 for x in diffs) / n
        std_diff = math.sqrt(variance)
        max_diff = max(diffs)

        mean_f1 = sum(f1_vals) / n
        mean_f2 = sum(f2_vals) / n
        flow_ratio = mean_f2 / max(0.01, mean_f1)

        # Level decay rate: % drop across the sample window
        if n >= 2:
            level_start = readings[-1].water_level_pct  # older reading
            level_end = readings[0].water_level_pct     # latest reading
            level_decay = max(0.0, level_start - level_end)
        else:
            level_decay = 0.0

        duty_cycle = sum(pumps) / n

        return {
            "sample_count": n,
            "mean_flow_diff": round(mean_diff, 3),
            "std_flow_diff": round(std_diff, 3),
            "max_flow_diff": round(max_diff, 3),
            "flow_ratio": round(flow_ratio, 3),
            "level_decay_pct": round(level_decay, 2),
            "pump_duty_cycle": round(duty_cycle, 2),
        }

    @staticmethod
    def extract_demand_features(readings: List[SensorReading]) -> Dict[str, Any]:
        """Extract historical consumption volume features for demand forecasting."""
        if not readings:
            return {"sample_count": 0, "hourly_flow_avg": 0.0, "total_liters": 0.0}

        flows = [r.flow_1_lpm for r in readings]
        totals = [r.flow_1_total_liters for r in readings]

        avg_flow = sum(flows) / len(flows)
        total_accumulated = max(totals) if totals else 0.0

        return {
            "sample_count": len(readings),
            "hourly_flow_avg": round(avg_flow, 2),
            "total_liters": round(total_accumulated, 2),
        }
