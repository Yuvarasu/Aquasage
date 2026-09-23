import { create } from 'zustand';

interface SettingsState {
  serverHost: string;
  serverPort: string;
  autoSwitchSimulation: boolean;
  telemetryPollingInterval: number; // in ms
  
  // Actions
  setServerHost: (host: string) => void;
  setServerPort: (port: string) => void;
  setAutoSwitchSimulation: (enabled: boolean) => void;
  setTelemetryPollingInterval: (interval: number) => void;
  resetToDefaults: () => void;
}

const DEFAULT_HOST = '10.10.72.92';
const DEFAULT_PORT = '8000';

export const useSettingsStore = create<SettingsState>((set) => ({
  serverHost: DEFAULT_HOST,
  serverPort: DEFAULT_PORT,
  autoSwitchSimulation: true,
  telemetryPollingInterval: 5000,

  setServerHost: (serverHost: string) => set({ serverHost: serverHost.trim() }),
  setServerPort: (serverPort: string) => set({ serverPort: serverPort.trim() }),
  setAutoSwitchSimulation: (autoSwitchSimulation: boolean) => set({ autoSwitchSimulation }),
  setTelemetryPollingInterval: (telemetryPollingInterval: number) => set({ telemetryPollingInterval }),
  resetToDefaults: () =>
    set({
      serverHost: DEFAULT_HOST,
      serverPort: DEFAULT_PORT,
      autoSwitchSimulation: true,
      telemetryPollingInterval: 5000,
    }),
}));
