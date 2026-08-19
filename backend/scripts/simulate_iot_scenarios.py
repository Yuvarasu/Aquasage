import argparse
import asyncio
import json
import random
import time
from datetime import datetime, timezone
import httpx

BACKEND_URL = "http://localhost:8000/api/v1/sensor-data"


def generate_payload(scenario: str, step: int, tank_id: int = 1, device_id: str = "ESP32_TANK_01") -> dict:
    """Generate Section 11 telemetry payload matching the desired operational scenario."""
    now_iso = datetime.now(timezone.utc).isoformat()

    if scenario == "normal":
        # Normal closed-loop balanced flow
        distance_cm = 6.0 + (random.uniform(-0.1, 0.1))
        water_level_pct = round(((30.0 - distance_cm) / 30.0) * 100.0, 1)
        flow_1 = 9.8 + (random.uniform(-0.2, 0.2))
        flow_2 = flow_1 - random.uniform(0.05, 0.15)  # Minimal loss
        tds = 125.0 + random.uniform(-5.0, 5.0)
        turbidity = random.randint(950, 1100)
        pump_on = True

    elif scenario == "leak":
        # Leak in pipeline section between FS1 and FS2
        distance_cm = 6.0 + (step * 0.15)  # Tank level steadily dropping
        water_level_pct = round(max(5.0, ((30.0 - distance_cm) / 30.0) * 100.0), 1)
        flow_1 = 10.0 + random.uniform(-0.2, 0.2)
        flow_2 = 6.8 + random.uniform(-0.2, 0.2)  # 3.2 LPM water loss!
        tds = 130.0
        turbidity = 1100
        pump_on = True

    elif scenario == "contamination":
        # Water quality contamination event
        distance_cm = 6.0
        water_level_pct = 80.0
        flow_1 = 9.8
        flow_2 = 9.6
        tds = 780.0 + random.uniform(-10.0, 20.0)  # Exceeds 600 PPM
        turbidity = 3400 + random.randint(50, 200)   # Exceeds 3000 ADC
        pump_on = True

    elif scenario == "low_water":
        # Tank nearly empty, pump interlock
        distance_cm = 26.5  # Only 3.5cm water left
        water_level_pct = 11.6  # <20% critical low
        flow_1 = 0.0
        flow_2 = 0.0
        tds = 140.0
        turbidity = 1050
        pump_on = False

    else:
        raise ValueError(f"Unknown scenario: {scenario}")

    return {
        "device_id": device_id,
        "tank_id": tank_id,
        "timestamp": now_iso,
        "tank": {
            "distance_cm": round(distance_cm, 2),
            "water_level_percent": water_level_pct,
        },
        "flow": {
            "flow_1_lpm": round(flow_1, 2),
            "flow_2_lpm": round(flow_2, 2),
            "flow_1_total_liters": round(step * 1.5, 2),
            "flow_2_total_liters": round(step * 1.2, 2),
        },
        "water_quality": {
            "tds_ppm": round(tds, 1),
            "turbidity_raw": turbidity,
        },
        "pump": {
            "status": pump_on,
        },
        "device": {
            "wifi_rssi": random.randint(-60, -48),
            "firmware_version": "0.1.0",
        },
    }


async def run_simulation(scenario: str, iterations: int = 10, interval: float = 1.0, url: str = BACKEND_URL):
    """Send simulated telemetry stream to FastAPI backend."""
    print(f"=== Starting AquaSage Simulator ===")
    print(f"Target URL: {url}")
    print(f"Scenario:   {scenario.upper()}")
    print(f"Iterations: {iterations} packets (interval: {interval}s)\n")

    async with httpx.AsyncClient() as client:
        for step in range(1, iterations + 1):
            payload = generate_payload(scenario=scenario, step=step)
            try:
                t0 = time.time()
                resp = await client.post(url, json=payload, timeout=5.0)
                dt = (time.time() - t0) * 1000

                if resp.status_code == 201:
                    data = resp.json().get("data", {})
                    print(
                        f"[{step}/{iterations}] 201 Created ({dt:.1f}ms) | "
                        f"Level: {data.get('water_level_pct')}% | "
                        f"F1: {data.get('flow_1_lpm')}L/m | "
                        f"F2: {data.get('flow_2_lpm')}L/m | "
                        f"Loss: {data.get('estimated_water_loss_lpm')}L/m | "
                        f"Leak: {data.get('possible_leak')} | "
                        f"TDS: {data.get('tds_ppm')}ppm"
                    )
                else:
                    print(f"[{step}/{iterations}] Error {resp.status_code}: {resp.text}")
            except Exception as e:
                print(f"[{step}/{iterations}] Connection error: {e}")

            if step < iterations:
                await asyncio.sleep(interval)

    print(f"\n=== Simulation Complete ===")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AquaSage IoT Telemetry Simulator (ESP32/Node-RED)")
    parser.add_argument(
        "--scenario",
        choices=["normal", "leak", "contamination", "low_water"],
        default="normal",
        help="Operational scenario to simulate",
    )
    parser.add_argument("--count", type=int, default=10, help="Number of telemetry packets to stream")
    parser.add_argument("--interval", type=float, default=1.0, help="Seconds between packets")
    parser.add_argument("--url", default=BACKEND_URL, help="Backend sensor ingestion URL")
    args = parser.parse_args()

    asyncio.run(
        run_simulation(
            scenario=args.scenario,
            iterations=args.count,
            interval=args.interval,
            url=args.url,
        )
    )
