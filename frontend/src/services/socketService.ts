import { getWsBaseUrl } from '../config/apiConfig';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { useAlertStore } from '../store/useAlertStore';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private pingTimestamp: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 0;
  private isIntentionallyClosed: boolean = false;

  /** Connect to WebSocket stream with dynamic URL resolution and exponential backoff */
  connect(url?: string) {
    const wsUrl = url || getWsBaseUrl();

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isIntentionallyClosed = false;
    useTelemetryStore.getState().setConnectionState('connecting');

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[WebSocket] Connected to SCADA Stream at:', wsUrl);
        this.reconnectAttempts = 0;
        useTelemetryStore.getState().setConnectionState('connected');

        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }

        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);

          // Handle Heartbeat / Pong response
          if (rawData.event === 'pong' || rawData.type === 'pong' || rawData.event === 'ack') {
            if (this.pingTimestamp > 0) {
              const latency = Math.max(1, Date.now() - this.pingTimestamp);
              useTelemetryStore.getState().setLatencyMs(latency);
            }
            return;
          }

          // Handle SCADA Alert broadcast
          if (rawData.event === 'alert' || rawData.event === 'scada_alarm') {
            const alertData = rawData.data || rawData;
            if (alertData.title) {
              useAlertStore.getState().addAlarm({
                title: alertData.title,
                message: alertData.message || alertData.description || 'System warning',
                severity: alertData.severity || 'warning',
                sourceNode: alertData.sourceNode || alertData.source_node || 'PUMP_01',
              });
            }
            return;
          }

          // Handle Telemetry Update
          const telemetry = rawData.data || (rawData.event === 'telemetry_update' ? rawData.data : rawData);

          if (
            telemetry &&
            (telemetry.pressure !== undefined ||
              telemetry.pressure_bar !== undefined ||
              telemetry.flowRate !== undefined ||
              telemetry.flow_rate_lmin !== undefined ||
              telemetry.tankLevel !== undefined ||
              telemetry.water_level_pct !== undefined)
          ) {
            useTelemetryStore.getState().updateTelemetry(
              {
                pressure: telemetry.pressure ?? telemetry.pressure_bar,
                flowRate: telemetry.flowRate ?? telemetry.flow_rate_lmin ?? telemetry.flow_1_lpm ?? 0,
                tankLevel: telemetry.tankLevel ?? telemetry.water_level_pct ?? 0,
                pumpStatus: telemetry.pumpStatus ?? (telemetry.flowRate > 0 ? 'running' : 'stopped'),
                pumpRPM: telemetry.pumpRPM ?? 1450,
                dailyConsumptionLiters: telemetry.dailyConsumptionLiters ?? telemetry.daily_consumption_liters ?? 0,
                leakProbability: telemetry.leakProbability ?? telemetry.leak_probability ?? 0,
                pumpHealthScore: telemetry.pumpHealthScore ?? 95,
                waterTurbidityNTU: telemetry.waterTurbidityNTU ?? telemetry.turbidity_ntu ?? 0.4,
                pHLevel: telemetry.pHLevel ?? telemetry.ph_level ?? 7.2,
                valveStatus: telemetry.valveStatus ?? (telemetry.pumpStatus === 'running' ? 'OPEN' : 'CLOSED'),
              },
              'live_websocket'
            );
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse payload:', err);
        }
      };

      this.socket.onclose = (event) => {
        this.stopHeartbeat();
        if (!this.isIntentionallyClosed) {
          console.warn(`[WebSocket] Closed (Code: ${event.code}). Scheduling reconnect...`);
          useTelemetryStore.getState().setConnectionState('reconnecting');
          this.scheduleReconnect();
        } else {
          useTelemetryStore.getState().setConnectionState('disconnected');
        }
      };

      this.socket.onerror = (error) => {
        console.warn('[WebSocket] Transport Error:', error);
      };
    } catch (error) {
      console.error('[WebSocket] Instantiation Fault:', error);
      this.scheduleReconnect();
    }
  }

  /** Exponential backoff with randomized jitter */
  private scheduleReconnect() {
    if (this.reconnectTimeout || this.isIntentionallyClosed) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnect attempts reached. Setting disconnected state.');
      useTelemetryStore.getState().setConnectionState('disconnected');
      return;
    }

    this.reconnectAttempts++;
    // Exponential delay: 1s, 2s, 4s, 8s, up to 30s max + jitter
    const baseDelay = Math.min(30000, 1000 * Math.pow(1.8, this.reconnectAttempts - 1));
    const jitter = Math.random() * 800;
    const delay = Math.round(baseDelay + jitter);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  /** Periodic Heartbeat (every 15 seconds) to track network roundtrip latency */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.pingTimestamp = Date.now();
        try {
          this.socket.send(JSON.stringify({ type: 'ping', timestamp: this.pingTimestamp }));
        } catch (e) {
          // Socket might be dropping
        }
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /** Manual Reconnect trigger (e.g. from UI button) */
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  /** Graceful disconnect */
  disconnect() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    useTelemetryStore.getState().setConnectionState('disconnected');
  }
}

export const socketService = new WebSocketService();