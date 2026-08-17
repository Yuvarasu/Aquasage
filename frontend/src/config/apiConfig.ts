// Central API Configuration for AquaSage Frontend
export const SYSTEM_IP = '10.10.32.35';
export const API_PORT = '8000';

export const API_BASE_URL = `http://${SYSTEM_IP}:${API_PORT}/api/v1`;
export const WS_BASE_URL = `ws://${SYSTEM_IP}:${API_PORT}/ws`;

export const ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  SYSTEM_STATUS: `${API_BASE_URL}/system/status`,
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  TELEMETRY_LATEST: `${API_BASE_URL}/sensor-data/latest`,
  TELEMETRY_INGEST: `${API_BASE_URL}/sensor-data`,
  DIGITAL_TWIN: (tankId: number) => `${API_BASE_URL}/digital-twin/${tankId}`,
  ALERTS: `${API_BASE_URL}/alerts`,
  ACKNOWLEDGE_ALERT: (id: string) => `${API_BASE_URL}/alerts/${id}/acknowledge`,
  DEVICES: `${API_BASE_URL}/devices`,
  REGISTER_DEVICE: `${API_BASE_URL}/devices/register`,
  CONSUMPTION_ANALYTICS: `${API_BASE_URL}/analytics/consumption`,
  WATER_QUALITY_TRENDS: `${API_BASE_URL}/analytics/water-quality-trends`,
  TANK_TRENDS: (tankId: number) => `${API_BASE_URL}/analytics/tank-trends/${tankId}`,
};
