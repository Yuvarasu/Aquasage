import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTelemetryStore } from '../../src/store/useTelemetryStore';

export default function SettingsScreen() {
  const { data, updateTelemetry, isSimulating, toggleSimulation } = useTelemetryStore();

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4">
      <Text className="text-white font-black text-2xl mb-1">SCADA Hardware Control</Text>
      <Text className="text-slate-400 text-xs mb-4">Realtime Simulator & Network Configs</Text>

      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex-row justify-between items-center">
        <Text className="text-white font-bold">Internal Telemetry Simulator</Text>
        <Switch
          value={isSimulating}
          onValueChange={toggleSimulation}
          trackColor={{ false: '#334155', true: '#06B6D4' }}
        />
      </View>

      {/* SLIDER 1: PRESSURE OVERRIDE */}
      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3">
        <Text className="text-slate-300 font-bold mb-1">
          Simulate Pressure: {data.pressure.toFixed(1)} Bar
        </Text>
        <Slider
          minimumValue={0}
          maximumValue={8}
          value={data.pressure}
          onValueChange={(val) => updateTelemetry({ pressure: val })}
          minimumTrackTintColor="#06B6D4"
          maximumTrackTintColor="#334155"
        />
      </View>

      {/* SLIDER 2: FLOW RATE OVERRIDE */}
      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3">
        <Text className="text-slate-300 font-bold mb-1">
          Simulate Flow Rate: {data.flowRate.toFixed(1)} L/min
        </Text>
        <Slider
          minimumValue={0}
          maximumValue={120}
          value={data.flowRate}
          onValueChange={(val) => updateTelemetry({ flowRate: val })}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#334155"
        />
      </View>

      {/* PUMP CONTROL TOGGLE */}
      <View className="flex-row space-x-2 mt-2">
        <TouchableOpacity
          onPress={() => updateTelemetry({ pumpStatus: 'running' })}
          className="flex-1 bg-emerald-600 p-3 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-xs">PUMP START</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => updateTelemetry({ pumpStatus: 'stopped' })}
          className="flex-1 bg-slate-700 p-3 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-xs">PUMP STOP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => updateTelemetry({ pumpStatus: 'fault' })}
          className="flex-1 bg-rose-600 p-3 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-xs">SIM FAULT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}