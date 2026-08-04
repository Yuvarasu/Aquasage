import { useAlertStore } from "../store/useAlertStore";
import { useTelemetryStore } from "../store/useTelemetryStore";

class TelemetrySimulator {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      const { isSimulating, data, updateTelemetry } =
        useTelemetryStore.getState();
      if (!isSimulating) return;

      // Realistic hydraulic fluctuations
      const flowDelta = (Math.random() - 0.48) * 2.5;
      const newFlow = Math.max(0, Math.min(120, data.flowRate + flowDelta));

      // Hydraulic pressure dynamic link to flow rate
      const pressureDelta = (Math.random() - 0.5) * 0.15;
      const newPressure =
        newFlow > 0
          ? Math.max(0.5, Math.min(8.0, 3.5 + newFlow / 30 + pressureDelta))
          : 0.2;

      // Tank filling / emptying physics simulation
      const tankFillRate =
        data.pumpStatus === "running" ? newFlow * 0.015 : -0.05;
      const newTankLevel = Math.max(
        0,
        Math.min(100, data.tankLevel + tankFillRate),
      );

      // Dynamic AI leak simulation
      const leakProb = newPressure > 5.5 ? 0.68 : 0.05 + Math.random() * 0.05;

      updateTelemetry({
        flowRate: parseFloat(newFlow.toFixed(1)),
        pressure: parseFloat(newPressure.toFixed(2)),
        tankLevel: parseFloat(newTankLevel.toFixed(1)),
        leakProbability: parseFloat(leakProb.toFixed(2)),
        dailyConsumptionLiters:
          data.dailyConsumptionLiters + Math.round(newFlow / 12),
      });

      // Threshold Safety Inspections & Auto Alarms
      if (newPressure > 6.0) {
        useAlertStore.getState().addAlarm({
          title: "OVERPRESSURE WARNING",
          message: `Main pipeline pressure hit extreme level: ${newPressure.toFixed(2)} Bar!`,
          severity: "critical",
          sourceNode: "PRESSURE_SEN_01",
        });
      }
    }, 1500);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const mockSimulator = new TelemetrySimulator();
