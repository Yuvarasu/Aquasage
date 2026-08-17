export type PumpStatus = 'running' | 'stopped' | 'fault';
export type AlarmSeverity = 'critical' | 'warning' | 'info';

export interface TelemetryData {
  timestamp: string;
  pressure: number;       // in Bar (Normal: 2.0 - 5.0)
  flowRate: number;       // in L/min (Normal: 10.0 - 100.0)
  tankLevel: number;      // Percentage (0 - 100%)
  tankCapacityLiters: number; // Max Capacity e.g. 50,000L
  pumpStatus: PumpStatus;
  pumpRPM: number;
  
  // Consumption Analytics
  dailyConsumptionLiters: number;
  hourlyConsumptionLiters: number;

  // AI Diagnostic Indicators
  leakProbability: number;    // 0.0 - 1.0 (Percentage)
  pumpHealthScore: number;    // 0 - 100%
  valveStatus: 'OPEN' | 'CLOSED' | 'PARTIAL';
  waterTurbidityNTU: number;  // Water Quality
  pHLevel: number;
}

export interface SCADAAlarm {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  severity: AlarmSeverity;
  sourceNode: 'RESERVOIR' | 'PUMP_01' | 'PRESSURE_SEN_01' | 'FLOW_SEN_01' | 'VILLAGE_TANK';
  acknowledged: boolean;
}

export interface DeviceNode {
  id: string;
  name: string;
  type: 'Sensor' | 'Actuator' | 'Gateway' | 'Transmitter';
  protocol: 'LoRaWAN' | 'WiFi' | 'RS485/Modbus';
  batteryLevel: number;
  signalRSSI: number;
  firmwareVersion: string;
  isOnline: boolean;
}