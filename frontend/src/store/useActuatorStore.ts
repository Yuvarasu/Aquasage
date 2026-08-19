import { create } from 'zustand';
import { useTelemetryStore } from './useTelemetryStore';

export interface CommandLogEntry {
  id: string;
  timestamp: string;
  targetNode: string;
  command: string;
  parameter?: string;
  status: 'DISPATCHED' | 'ACKNOWLEDGED' | 'FAILED';
  operator: string;
}

interface ActuatorState {
  pumpTargetRPM: number;
  valvePositionPct: number;
  valveState: 'OPEN' | 'CLOSED' | 'PARTIAL';
  isEmergencyStopped: boolean;
  auditLogs: CommandLogEntry[];

  // Actions
  setPumpRPM: (rpm: number) => void;
  setValvePosition: (positionPct: number) => void;
  triggerEmergencyStop: () => void;
  resetEmergencyStop: () => void;
  addAuditLog: (log: Omit<CommandLogEntry, 'id' | 'timestamp'>) => void;
}

export const useActuatorStore = create<ActuatorState>((set, get) => ({
  pumpTargetRPM: 1450,
  valvePositionPct: 100,
  valveState: 'OPEN',
  isEmergencyStopped: false,
  auditLogs: [
    {
      id: 'cmd-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toLocaleTimeString(),
      targetNode: 'PUMP-VFD-01',
      command: 'START_MOTOR',
      parameter: '1450 RPM',
      status: 'ACKNOWLEDGED',
      operator: 'Lead SCADA Engineer',
    },
    {
      id: 'cmd-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toLocaleTimeString(),
      targetNode: 'VALVE-SOL-01',
      command: 'SET_ORIFICE',
      parameter: '100% (Full Bore)',
      status: 'ACKNOWLEDGED',
      operator: 'Automated Hydraulic Logic',
    },
  ],

  setPumpRPM: (rpm: number) => {
    const safeRPM = Math.min(1800, Math.max(0, Math.round(rpm)));
    set({ pumpTargetRPM: safeRPM });

    // Sync optimistically with telemetry store
    useTelemetryStore.getState().updateTelemetry({
      pumpRPM: safeRPM,
      pumpStatus: safeRPM > 0 ? 'running' : 'stopped',
    });

    get().addAuditLog({
      targetNode: 'PUMP-VFD-01',
      command: 'SET_VFD_SPEED',
      parameter: `${safeRPM} RPM`,
      status: 'ACKNOWLEDGED',
      operator: 'Operator Control',
    });
  },

  setValvePosition: (pct: number) => {
    const safePct = Math.min(100, Math.max(0, Math.round(pct)));
    const state = safePct === 0 ? 'CLOSED' : safePct === 100 ? 'OPEN' : 'PARTIAL';
    set({ valvePositionPct: safePct, valveState: state });

    useTelemetryStore.getState().updateTelemetry({
      valveStatus: state,
    });

    get().addAuditLog({
      targetNode: 'VALVE-SOL-01',
      command: 'SET_VALVE_ORIFICE',
      parameter: `${safePct}% (${state})`,
      status: 'ACKNOWLEDGED',
      operator: 'Operator Control',
    });
  },

  triggerEmergencyStop: () => {
    set({
      isEmergencyStopped: true,
      pumpTargetRPM: 0,
      valvePositionPct: 0,
      valveState: 'CLOSED',
    });

    useTelemetryStore.getState().updateTelemetry({
      pumpStatus: 'stopped',
      pumpRPM: 0,
      valveStatus: 'CLOSED',
      flowRate: 0,
    });

    get().addAuditLog({
      targetNode: 'MASTER_SCADA_BUS',
      command: 'EMERGENCY_ESTOP_ENGAGED',
      parameter: 'All Actuators Cutoff (Zero Flow)',
      status: 'ACKNOWLEDGED',
      operator: 'Safety Guard Interlock',
    });
  },

  resetEmergencyStop: () => {
    set({ isEmergencyStopped: false });

    get().addAuditLog({
      targetNode: 'MASTER_SCADA_BUS',
      command: 'ESTOP_MANUAL_RESET',
      parameter: 'System Interlocks Cleared',
      status: 'ACKNOWLEDGED',
      operator: 'Operator Override',
    });
  },

  addAuditLog: (log) =>
    set((state) => ({
      auditLogs: [
        {
          ...log,
          id: `cmd-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...state.auditLogs,
      ],
    })),
}));
