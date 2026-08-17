import { WS_BASE_URL } from '../config/apiConfig';
import { useTelemetryStore } from '../store/useTelemetryStore';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectInterval: ReturnType<typeof setInterval> | null = null;

  connect(url: string = WS_BASE_URL) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('Connected to backend WebSocket at:', url);
        useTelemetryStore.getState().setConnectionStatus(true);
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          const telemetry = rawData.data || rawData;

          if (telemetry && (telemetry.pressure !== undefined || telemetry.flowRate !== undefined || telemetry.tankLevel !== undefined)) {
            useTelemetryStore.getState().updateTelemetry({
              pressure: telemetry.pressure ?? telemetry.pressure_bar,
              flowRate: telemetry.flowRate ?? telemetry.flow_rate_lmin ?? telemetry.flow,
              tankLevel: telemetry.tankLevel ?? telemetry.water_level_pct,
              pumpStatus: telemetry.pumpStatus,
              leakProbability: telemetry.leakProbability ?? telemetry.leak_probability,
              waterTurbidityNTU: telemetry.waterTurbidityNTU,
              pHLevel: telemetry.pHLevel,
            });
          }
        } catch (err) {
          console.error('Failed to parse WebSocket telemetry payload:', err);
        }
      };

      this.socket.onclose = () => {
        console.warn('Backend WebSocket closed. Reconnecting...');
        useTelemetryStore.getState().setConnectionStatus(false);
      };

      this.socket.onerror = (error) => {
        console.warn('WebSocket Connection Error:', error);
      };
    } catch (error) {
      console.error('WebSocket Connection Fault:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const socketService = new WebSocketService();