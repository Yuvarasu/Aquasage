import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTelemetryStore } from '../../src/store/useTelemetryStore';

export default function AIInsightsScreen() {
  const { data } = useTelemetryStore();

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4">
      <Text className="text-white font-extrabold text-2xl mb-1">AI Predictive Diagnostics</Text>
      <Text className="text-slate-400 text-xs mb-4">Neural Network Hydraulic Anomaly Analyzer</Text>

      {/* Predictive Card 1: Pipeline Leak */}
      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-cyan-400 font-bold">Leak Detection Model</Text>
          <Text className="text-slate-400 text-xs">Confidence: 96.4%</Text>
        </View>
        <Text className="text-white text-3xl font-extrabold font-mono mb-1">
          {(data.leakProbability * 100).toFixed(1)}% RISK
        </Text>
        <Text className="text-slate-400 text-xs">
          {data.leakProbability > 0.5 
            ? 'CRITICAL: Micro-burst pattern identified between Pressure Sensor 01 and Node B.'
            : 'Normal pressure-flow correlation across distribution lines.'}
        </Text>
      </View>

      {/* Predictive Card 2: Pump RUL (Remaining Useful Life) */}
      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3">
        <Text className="text-emerald-400 font-bold mb-1">Pump Motor Prognostics</Text>
        <Text className="text-white text-2xl font-bold font-mono">3,420 Hours RUL</Text>
        <Text className="text-slate-400 text-xs mt-1">
          Vibration spectral harmonics indicate normal bearing wear. Scheduled maintenance in 140 days.
        </Text>
      </View>
    </ScrollView>
  );
}