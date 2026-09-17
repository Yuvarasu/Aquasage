import { create } from 'zustand';
import { TelemetryData, ConnectionState, StreamSource } from '../types/telemetry';
import { useSettingsStore } from './useSettingsStore';

interface TelemetryState {
  data: TelemetryData;
  connectionState: ConnectionState;
  isConnected: boolean;
  isSimulating: boolean;
  streamSource: StreamSource;
  latencyMs: number;
  lastPacketTime: string | null;

  updateTelemetry: (newData: Partial<TelemetryData>, source?: StreamSource) => void;
  setConnectionState: (state: ConnectionState) => void;
  setConnectionStatus: (status: boolean) => void;
  setLatencyMs: (ms: number) => void;
  toggleSimulation: (simulating: boolean) => void;
}

const initialTelemetry: TelemetryData = {
  timestamp: new Date().toISOString(),
  pressure: 3.8,
  flowRate: 42.6,
  tankLevel: 72,
  tankCapacityLiters: 50000,
  pumpStatus: 'running',
  pumpRPM: 1450,
  dailyConsumptionLiters: 18450,
  hourlyConsumptionLiters: 1250,
  leakProbability: 0.08,
  pumpHealthScore: 94,
  valveStatus: 'OPEN',
  waterTurbidityNTU: 0.4,
  pHLevel: 7.2,
  tdsLevel: 312,
};

export const useTelemetryStore = create<TelemetryState>((set) => ({
  data: initialTelemetry,
  connectionState: 'disconnected',
  isConnected: false,
  isSimulating: false,
  streamSource: 'internal_simulator',
  latencyMs: 0,
  lastPacketTime: null,

  updateTelemetry: (newData, source = 'live_websocket') =>
    set((state) => {
      const { autoSwitchSimulation } = useSettingsStore.getState();
      const shouldDisableSim = autoSwitchSimulation && source === 'live_websocket' && state.isSimulating;

      return {
        data: { ...state.data, ...newData, timestamp: new Date().toISOString() },
        lastPacketTime: new Date().toISOString(),
        streamSource: source,
        isSimulating: shouldDisableSim ? false : state.isSimulating,
      };
    }),

  setConnectionState: (connectionState) =>
    set({
      connectionState,
      isConnected: connectionState === 'connected',
    }),

  setConnectionStatus: (isConnected) =>
    set({
      isConnected,
      connectionState: isConnected ? 'connected' : 'disconnected',
    }),

  setLatencyMs: (latencyMs) => set({ latencyMs }),

  toggleSimulation: (isSimulating) =>
    set({
      isSimulating,
      streamSource: isSimulating ? 'internal_simulator' : 'live_websocket',
    }),
}));