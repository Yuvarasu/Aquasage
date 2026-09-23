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
  flowRate: 0.0,
  tankLevel: 75,
  tankCapacityLiters: 20,
  pumpStatus: 'stopped',
  pumpRPM: 0,
  dailyConsumptionLiters: 0,
  hourlyConsumptionLiters: 0,
  leakProbability: 0.02,
  pumpHealthScore: 98,
  valveStatus: 'OPEN',
  waterTurbidityNTU: 0.4,
  pHLevel: 7.2,
  tdsLevel: 135,
  distance_cm: 6.25,
  water_height_cm: 18.75,
  tankHeightCm: 25.0,
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