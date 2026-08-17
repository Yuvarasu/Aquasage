import { ENDPOINTS } from '../config/apiConfig';
import { TelemetryData, SCADAAlarm, DeviceNode } from '../types/telemetry';

export class ApiService {
  /** Fetch latest live telemetry from backend */
  static async fetchLatestTelemetry(): Promise<TelemetryData | null> {
    try {
      const response = await fetch(ENDPOINTS.TELEMETRY_LATEST);
      if (!response.ok) return null;
      const result = await response.json();
      if (result.success && result.data) {
        return result.data as TelemetryData;
      }
      return null;
    } catch (error) {
      console.warn('API fetchLatestTelemetry error:', error);
      return null;
    }
  }

  /** Fetch Digital Twin State for specified tank */
  static async fetchDigitalTwin(tankId: number = 1): Promise<any | null> {
    try {
      const response = await fetch(ENDPOINTS.DIGITAL_TWIN(tankId));
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('API fetchDigitalTwin error:', error);
      return null;
    }
  }

  /** Fetch SCADA Alarms */
  static async fetchAlarms(): Promise<SCADAAlarm[]> {
    try {
      const response = await fetch(ENDPOINTS.ALERTS);
      if (!response.ok) return [];
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.warn('API fetchAlarms error:', error);
      return [];
    }
  }

  /** Acknowledge Alarm by ID */
  static async acknowledgeAlarm(alarmId: string): Promise<boolean> {
    try {
      const response = await fetch(ENDPOINTS.ACKNOWLEDGE_ALERT(alarmId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch (error) {
      console.warn('API acknowledgeAlarm error:', error);
      return false;
    }
  }

  /** Fetch Registered IoT Devices */
  static async fetchDevices(): Promise<DeviceNode[]> {
    try {
      const response = await fetch(ENDPOINTS.DEVICES);
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
      console.warn('API fetchDevices error:', error);
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
      const response = await fetch(ENDPOINTS.TELEMETRY_INGEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (error) {
      console.warn('API ingestSensorReading error:', error);
      return false;
    }
  }

  /** Fetch Consumption Analytics */
  static async fetchConsumptionAnalytics(timeframe: string = 'daily'): Promise<any | null> {
    try {
      const response = await fetch(`${ENDPOINTS.CONSUMPTION_ANALYTICS}?timeframe=${timeframe}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('API fetchConsumptionAnalytics error:', error);
      return null;
    }
  }
}
