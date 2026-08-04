import { useTelemetryStore } from '../store/useTelemetryStore';

class WebSocketService {
  private socket: WebSocket | null = null;

  connect(url: string) {
    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        useTelemetryStore.getState().setConnectionStatus(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          // Stream sensor updates directly into Zustand store
          useTelemetryStore.getState().updateTelemetry({
            pressure: rawData.pressure,
            flowRate: rawData.flow,
            tankLevel: rawData.tankLevel,
            pumpStatus: rawData.pumpStatus,
            leakProbability: rawData.leakProbability,
          });
        } catch (err) {
          console.error('Failed to parse WebSocket JSON telemetry payload', err);
        }
      };

      this.socket.onclose = () => {
        useTelemetryStore.getState().setConnectionStatus(false);
      };
    } catch (error) {
      console.error('WebSocket Connection Fault:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const socketService = new WebSocketService();