import { create } from 'zustand';
import { SCADAAlarm } from '../types/telemetry';

interface AlertState {
  alarms: SCADAAlarm[];
  addAlarm: (alarm: Omit<SCADAAlarm, 'id' | 'timestamp' | 'acknowledged'>) => void;
  acknowledgeAlarm: (id: string) => void;
  clearAll: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alarms: [
    {
      id: 'alm-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      title: 'Micro-Leak Detected',
      message: 'Pressure drop anomaly detected in Main Distribution Pipe B.',
      severity: 'warning',
      sourceNode: 'PRESSURE_SEN_01',
      acknowledged: false,
    },
    {
      id: 'alm-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString(),
      title: 'High Flow Velocity',
      message: 'Flow rate exceeded threshold 85 L/min for 5 minutes.',
      severity: 'info',
      sourceNode: 'FLOW_SEN_01',
      acknowledged: true,
    }
  ],
  addAlarm: (newAlarm) =>
    set((state) => ({
      alarms: [
        {
          ...newAlarm,
          id: `alm-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          acknowledged: false,
        },
        ...state.alarms,
      ],
    })),
  acknowledgeAlarm: (id) =>
    set((state) => ({
      alarms: state.alarms.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    })),
  clearAll: () => set({ alarms: [] }),
}));