import { create } from 'zustand';
import { TelemetryData } from '../types/telemetry';

interface TelemetryState {
  data: TelemetryData;
  isConnected: boolean;
  isSimulating: boolean;
  updateTelemetry: (newData: Partial<TelemetryData>) => void;
  setConnectionStatus: (status: boolean) => void;
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
};

export const useTelemetryStore = create<TelemetryState>((set) => ({
  data: initialTelemetry,
  isConnected: true,
  isSimulating: true,
  updateTelemetry: (newData) =>
    set((state) => ({
      data: { ...state.data, ...newData, timestamp: new Date().toISOString() },
    })),
  setConnectionStatus: (isConnected) => set({ isConnected }),
  toggleSimulation: (isSimulating) => set({ isSimulating }),
}));