import { useAlertStore } from "../store/useAlertStore";
import { useTelemetryStore } from "../store/useTelemetryStore";

class TelemetrySimulator {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      const { isSimulating, data, updateTelemetry } = useTelemetryStore.getState();
      if (!isSimulating) return;

      const flowDelta = (Math.random() - 0.48) * 2.5;
      const newFlow = Math.max(0, Math.min(120, data.flowRate + flowDelta));

      const treatedFlow = newFlow * 0.98;

      const tankFillRate = treatedFlow > 0 ? treatedFlow * 0.015 : -0.05;
      const newTankLevel = Math.max(0, Math.min(100, data.tankLevel + tankFillRate));

      const pressureDelta = (Math.random() - 0.5) * 0.15;
      const newPressure = newFlow > 0
        ? Math.max(0.5, Math.min(8.0, 3.5 + newFlow / 30 + pressureDelta))
        : 0.2;

      const leakProb = newPressure > 5.5 ? 0.68 : 0.05 + Math.random() * 0.05;

      // Water quality sensor fluctuations
      const turbidityDelta = (Math.random() - 0.5) * 0.08;
      const newTurbidity = Math.max(0.05, Math.min(5.0, data.waterTurbidityNTU + turbidityDelta));

      const tdsDelta = (Math.random() - 0.5) * 8;
      const newTDS = Math.max(50, Math.min(1200, data.tdsLevel + tdsDelta));

      const phDelta = (Math.random() - 0.5) * 0.05;
      const newPH = Math.max(5.5, Math.min(9.5, data.pHLevel + phDelta));

      updateTelemetry({
        flowRate: parseFloat(newFlow.toFixed(1)),
        pressure: parseFloat(newPressure.toFixed(2)),
        tankLevel: parseFloat(newTankLevel.toFixed(1)),
        leakProbability: parseFloat(leakProb.toFixed(2)),
        waterTurbidityNTU: parseFloat(newTurbidity.toFixed(2)),
        tdsLevel: parseFloat(newTDS.toFixed(0)),
        pHLevel: parseFloat(newPH.toFixed(2)),
        dailyConsumptionLiters: data.dailyConsumptionLiters + Math.round(newFlow / 12),
      });

      if (newPressure > 6.0) {
        useAlertStore.getState().addAlarm({
          title: "OVERPRESSURE WARNING",
          message: `Main pipeline pressure hit extreme level: ${newPressure.toFixed(2)} Bar!`,
          severity: "critical",
          sourceNode: "PRESSURE_SEN_01",
        });
      }

      if (newTurbidity > 4.0) {
        useAlertStore.getState().addAlarm({
          title: "HIGH TURBIDITY ALERT",
          message: `Turbidity sensor reading ${newTurbidity.toFixed(2)} NTU exceeds safe limit!`,
          severity: "warning",
          sourceNode: "FLOW_SEN_01",
        });
      }

      if (newTDS > 900) {
        useAlertStore.getState().addAlarm({
          title: "HIGH TDS ALERT",
          message: `TDS sensor reading ${newTDS.toFixed(0)} ppm exceeds safe limit!`,
          severity: "warning",
          sourceNode: "FLOW_SEN_01",
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