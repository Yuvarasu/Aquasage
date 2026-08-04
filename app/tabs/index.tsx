import React, { useEffect } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { HeaderStatusBar } from '../../src/components/dashboard/HeaderStatusBar';
import { PipelineSchematic } from '../../src/components/digitalTwin/PipelineSchematic';
import { TelemetryCard } from '../../src/components/dashboard/TelemetryCard';
import { useTelemetryStore } from '../../src/store/useTelemetryStore';
import { mockSimulator } from '../../src/services/mockSimulator';

export default function DashboardScreen() {
  const { data } = useTelemetryStore();

  useEffect(() => {
    mockSimulator.start();
    return () => mockSimulator.stop();
  }, []);

  return (
    <View className="flex-1 bg-slate-950">
      <HeaderStatusBar />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* --- SCADA DIGITAL TWIN ANIMATED MAP --- */}
        <PipelineSchematic />

        {/* --- TELEMETRY GRID METRICS --- */}
        <Text className="text-slate-400 font-bold text-xs tracking-wider uppercase mt-3 mb-1">
          Real-Time Sensor Telemetry
        </Text>

        <View className="flex-row flex-wrap justify-between">
          <TelemetryCard
            title="System Pressure"
            value={data.pressure.toFixed(2)}
            unit="BAR"
            subtitle="Optimal Range: 2.5 - 4.5"
            statusColor={data.pressure > 5.5 ? 'rose' : 'cyan'}
          />
          <TelemetryCard
            title="Water Flow Rate"
            value={data.flowRate.toFixed(1)}
            unit="L/MIN"
            subtitle="Turbine Speed Active"
            statusColor="emerald"
          />
          <TelemetryCard
            title="Storage Tank"
            value={data.tankLevel.toFixed(0)}
            unit="%"
            subtitle={`${((data.tankLevel / 100) * data.tankCapacityLiters).toLocaleString()} Liters`}
            statusColor={data.tankLevel < 20 ? 'amber' : 'emerald'}
          />
          <TelemetryCard
            title="AI Leak Index"
            value={(data.leakProbability * 100).toFixed(0)}
            unit="%"
            subtitle={data.leakProbability > 0.5 ? 'Anomaly Warning' : 'Pipeline Intact'}
            statusColor={data.leakProbability > 0.5 ? 'rose' : 'emerald'}
          />
          <TelemetryCard
            title="Pump Health"
            value={data.pumpHealthScore}
            unit="%"
            subtitle={`RPM: ${data.pumpRPM}`}
            statusColor="emerald"
          />
          <TelemetryCard
            title="Today Usage"
            value={(data.dailyConsumptionLiters / 1000).toFixed(1)}
            unit="m³"
            subtitle="Cumulative Flow"
            statusColor="cyan"
          />
        </View>
      </ScrollView>
    </View>
  );
}