import { useSettingsStore } from '../store/useSettingsStore';
import Constants from 'expo-constants';

// Auto-detect host IP: if on Web uses browser host; if on Expo mobile uses Metro host; fallback to 10.10.72.92
export const getAutoDetectedHost = (): string => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const webHost = window.location.hostname;
    if (webHost && webHost !== 'localhost' && webHost !== '127.0.0.1') {
      return webHost;
    }
  }

  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }

  return '10.10.72.92';
};

export const DEFAULT_SYSTEM_IP = '10.10.72.92';
export const DEFAULT_API_PORT = '8000';

export const getApiBaseUrl = (): string => {
  const { serverHost, serverPort } = useSettingsStore.getState();
  // If serverHost is stale default 10.10.32.35, use auto-detected host
  const host = (!serverHost || serverHost === '10.10.32.35') ? getAutoDetectedHost() : serverHost;
  const port = serverPort || DEFAULT_API_PORT;
  return `http://${host}:${port}/api/v1`;
};

export const getWsBaseUrl = (): string => {
  const { serverHost, serverPort } = useSettingsStore.getState();
  const host = (!serverHost || serverHost === '10.10.32.35') ? getAutoDetectedHost() : serverHost;
  const port = serverPort || DEFAULT_API_PORT;
  return `ws://${host}:${port}/ws`;
};

// Central API Configuration for AquaSage Frontend with dynamic resolution
export const ENDPOINTS = {
  get HEALTH() { return `${getApiBaseUrl()}/health`; },
  get SYSTEM_STATUS() { return `${getApiBaseUrl()}/system/status`; },
  get AUTH_LOGIN() { return `${getApiBaseUrl()}/auth/login`; },
  get TELEMETRY_LATEST() { return `${getApiBaseUrl()}/sensor-data/latest`; },
  get TELEMETRY_INGEST() { return `${getApiBaseUrl()}/sensor-data`; },
  DIGITAL_TWIN: (tankId: number) => `${getApiBaseUrl()}/digital-twin/${tankId}`,
  get ALERTS() { return `${getApiBaseUrl()}/alerts`; },
  ACKNOWLEDGE_ALERT: (id: string) => `${getApiBaseUrl()}/alerts/${id}/acknowledge`,
  get DEVICES() { return `${getApiBaseUrl()}/devices`; },
  get REGISTER_DEVICE() { return `${getApiBaseUrl()}/devices/register`; },
  get CONSUMPTION_ANALYTICS() { return `${getApiBaseUrl()}/analytics/consumption`; },
  get WATER_QUALITY_TRENDS() { return `${getApiBaseUrl()}/analytics/water-quality-trends`; },
  TANK_TRENDS: (tankId: number) => `${getApiBaseUrl()}/analytics/tank-trends/${tankId}`,
  AI_INFER: (tankId: number) => `${getApiBaseUrl()}/ai/infer/${tankId}`,
  AI_PREDICTIONS: (tankId: number) => `${getApiBaseUrl()}/ai/predictions/${tankId}`,
  AI_DEMAND_FORECAST: (tankId: number) => `${getApiBaseUrl()}/ai/demand-forecast/${tankId}`,
  AI_INSIGHTS: (tankId: number) => `${getApiBaseUrl()}/ai/insights/${tankId}`,
};

/** Quick ping utility to verify server reachability */
export const testServerPing = async (host: string, port: string, timeoutMs: number = 3000): Promise<{ ok: boolean; latencyMs: number; error?: string }> => {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(`http://${host}:${port}/api/v1/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;
    return { ok: response.ok, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return { ok: false, latencyMs, error: err?.message || 'Connection timed out' };
  }
};

