import { getWsBaseUrl } from '../config/apiConfig';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { useAlertStore } from '../store/useAlertStore';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private pingTimestamp: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 50;
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
          if (rawData.event === 'alert' || rawData.event === 'scada_alarm' || rawData.event === 'alert_created') {
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

          // Handle Telemetry Update & Digital Twin Stream
          const telemetry = rawData.data || (rawData.event === 'telemetry_update' ? rawData.data : rawData);

          if (
            telemetry &&
            (telemetry.pressure !== undefined ||
              telemetry.pressure_bar !== undefined ||
              telemetry.flowRate !== undefined ||
              telemetry.flow_rate_lmin !== undefined ||
              telemetry.tankLevel !== undefined ||
              telemetry.water_level_pct !== undefined ||
              telemetry.tank_level_percent !== undefined)
          ) {
            const rawTurbidity = telemetry.turbidity_raw ?? 1000;
            const computedNTU = telemetry.waterTurbidityNTU ?? telemetry.turbidity_ntu ?? (rawTurbidity ? Number((rawTurbidity / 2500.0).toFixed(2)) : 0.4);

            const tankLvl = telemetry.tankLevel ?? telemetry.water_level_pct ?? telemetry.tank_level_percent ?? 0;
            const distCm = telemetry.distance_cm ?? telemetry.distance;
            const waterHeightCm = telemetry.water_height_cm ?? (distCm !== undefined ? Math.max(0, 25.0 - distCm) : Number(((tankLvl / 100) * 25.0).toFixed(1)));

            useTelemetryStore.getState().updateTelemetry(
              {
                pressure: telemetry.pressure ?? telemetry.pressure_bar ?? 3.8,
                flowRate: telemetry.flowRate ?? telemetry.flow_rate_lmin ?? telemetry.flow_1_lpm ?? telemetry.flow_in ?? 0,
                tankLevel: tankLvl,
                tankCapacityLiters: telemetry.tankCapacityLiters ?? telemetry.capacity_liters ?? 20,
                tankHeightCm: 25.0,
                distance_cm: distCm,
                water_height_cm: waterHeightCm,
                pumpStatus: telemetry.pumpStatus ?? (telemetry.pump === 'ON' ? 'running' : 'stopped'),
                pumpRPM: telemetry.pumpRPM ?? 1450,
                dailyConsumptionLiters: telemetry.dailyConsumptionLiters ?? telemetry.daily_consumption_liters ?? telemetry.flow_1_total_liters ?? 0,
                leakProbability: telemetry.leakProbability ?? telemetry.leak_probability ?? 0,
                pumpHealthScore: telemetry.pumpHealthScore ?? 95,
                waterTurbidityNTU: computedNTU,
                pHLevel: telemetry.pHLevel ?? telemetry.ph_level ?? 7.2,
                tdsLevel: telemetry.tdsLevel ?? telemetry.tds_ppm ?? telemetry.tds ?? 140,
                valveStatus: telemetry.valveStatus ?? (telemetry.pumpStatus === 'running' || telemetry.pump === 'ON' ? 'OPEN' : 'CLOSED'),
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

  /** Exponential backoff with randomized jitter and background polling resilience */
  private scheduleReconnect() {
    if (this.reconnectTimeout || this.isIntentionallyClosed) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnect burst reached. Falling back to 10s background interval.');
      this.reconnectAttempts = 1; // Reset to keep retrying periodically
    }

    this.reconnectAttempts++;
    // Exponential delay: 1s, 2s, 4s, 8s, up to 10s max + jitter
    const baseDelay = Math.min(10000, 1000 * Math.pow(1.5, Math.min(6, this.reconnectAttempts - 1)));
    const jitter = Math.random() * 500;
    const delay = Math.round(baseDelay + jitter);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})...`);
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