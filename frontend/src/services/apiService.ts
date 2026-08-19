import { ENDPOINTS } from '../config/apiConfig';
import { TelemetryData, SCADAAlarm, DeviceNode } from '../types/telemetry';

const DEFAULT_TIMEOUT_MS = 6000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export class ApiService {
  /** Fetch latest live telemetry from backend */
  static async fetchLatestTelemetry(): Promise<TelemetryData | null> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.TELEMETRY_LATEST);
      if (!response.ok) return null;
      const result = await response.json();
      if (result.success && result.data) {
        return result.data as TelemetryData;
      }
      return null;
    } catch (error) {
      console.warn('[ApiService] fetchLatestTelemetry error:', error);
      return null;
    }
  }

  /** Fetch Digital Twin State for specified tank */
  static async fetchDigitalTwin(tankId: number = 1): Promise<any | null> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.DIGITAL_TWIN(tankId));
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('[ApiService] fetchDigitalTwin error:', error);
      return null;
    }
  }

  /** Fetch SCADA Alarms */
  static async fetchAlarms(): Promise<SCADAAlarm[]> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.ALERTS);
      if (!response.ok) return [];
      const result = await response.json();
      return result.success && Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.warn('[ApiService] fetchAlarms error:', error);
      return [];
    }
  }

  /** Acknowledge Alarm by ID */
  static async acknowledgeAlarm(alarmId: string): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.ACKNOWLEDGE_ALERT(alarmId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch (error) {
      console.warn('[ApiService] acknowledgeAlarm error:', error);
      return false;
    }
  }

  /** Fetch Registered IoT Devices */
  static async fetchDevices(): Promise<DeviceNode[]> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.DEVICES);
      if (!response.ok) return [];
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        return result.data.map((d: any) => ({
          id: String(d.id),
          name: d.node_name,
          type: d.node_type || 'Sensor',
          protocol: d.protocol || 'WiFi',
          batteryLevel: d.battery_level ?? 100,
          signalRSSI: d.signal_rssi ?? -65,
          firmwareVersion: d.firmware_version || 'v1.0.0',
          isOnline: d.status === 'Online',
        }));
      }
      return [];
    } catch (error) {
      console.warn('[ApiService] fetchDevices error:', error);
      return [];
    }
  }

  /** Ingest telemetry reading (used for hardware overrides or sensor node posting) */
  static async ingestSensorReading(payload: {
    device_id: number;
    tank_id: number;
    distance_cm: number;
    water_level_pct: number;
    flow_rate_lmin: number;
    daily_consumption_liters: number;
    tds_ppm: number;
    pressure_bar: number;
  }): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.TELEMETRY_INGEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (error) {
      console.warn('[ApiService] ingestSensorReading error:', error);
      return false;
    }
  }

  /** Fetch Consumption Analytics */
  static async fetchConsumptionAnalytics(timeframe: string = 'daily'): Promise<any | null> {
    try {
      const response = await fetchWithTimeout(`${ENDPOINTS.CONSUMPTION_ANALYTICS}?timeframe=${timeframe}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('[ApiService] fetchConsumptionAnalytics error:', error);
      return null;
    }
  }

  /** Fetch Water Quality Trends (TDS, pH, Turbidity) */
  static async fetchWaterQualityTrends(): Promise<any | null> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.WATER_QUALITY_TRENDS);
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('[ApiService] fetchWaterQualityTrends error:', error);
      return null;
    }
  }

  /** Fetch Tank Volume & Level Trends */
  static async fetchTankTrends(tankId: number = 1): Promise<any | null> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.TANK_TRENDS(tankId));
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('[ApiService] fetchTankTrends error:', error);
      return null;
    }
  }

  /** Fetch AI Model Insights Summary */
  static async fetchAiInsightsSummary(tankId: number = 1): Promise<any | null> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.AI_INSIGHTS(tankId));
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('[ApiService] fetchAiInsightsSummary error:', error);
      return null;
    }
  }

  /** Fetch 24-Hour AI Demand Forecast Curve */
  static async fetchDemandForecast(tankId: number = 1): Promise<any | null> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.AI_DEMAND_FORECAST(tankId));
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('[ApiService] fetchDemandForecast error:', error);
      return null;
    }
  }

  /** Trigger On-Demand Machine Learning Inference */
  static async triggerAiInference(tankId: number = 1): Promise<any | null> {
    try {
      const response = await fetchWithTimeout(ENDPOINTS.AI_INFER(tankId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_type: 'all', window_size: 30 }),
      });
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('[ApiService] triggerAiInference error:', error);
      return null;
    }
  }
}


