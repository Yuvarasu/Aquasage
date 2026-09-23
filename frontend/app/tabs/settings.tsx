import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  Activity,
  Gauge,
  Power,
  Radio,
  Sliders,
  Server,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react-native';
import { useTelemetryStore } from '../../src/store/useTelemetryStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { ApiService } from '../../src/services/apiService';
import { socketService } from '../../src/services/socketService';
import { testServerPing } from '../../src/config/apiConfig';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { StatusBadge } from '../../src/components/ui/StatusBadge';

export default function SettingsScreen() {
  const { data, updateTelemetry, isSimulating, toggleSimulation } = useTelemetryStore();
  const {
    serverHost,
    serverPort,
    autoSwitchSimulation,
    setServerHost,
    setServerPort,
    setAutoSwitchSimulation,
    resetToDefaults,
  } = useSettingsStore();

  const [hostInput, setHostInput] = useState(serverHost);
  const [portInput, setPortInput] = useState(serverPort);
  const [pingStatus, setPingStatus] = useState<{ testing: boolean; success?: boolean; latencyMs?: number; error?: string } | null>(null);

  const isFault = data.pumpStatus === 'fault';
  const isRunning = data.pumpStatus === 'running';

  const handleSaveConnection = () => {
    setServerHost(hostInput);
    setServerPort(portInput);
    socketService.reconnect();
  };

  const handleTestPing = async () => {
    setPingStatus({ testing: true });
    const result = await testServerPing(hostInput, portInput);
    setPingStatus({
      testing: false,
      success: result.ok,
      latencyMs: result.latencyMs,
      error: result.error,
    });
  };

  const handleResetSettings = () => {
    resetToDefaults();
    setHostInput('10.10.72.92');
    setPortInput('8000');
    setPingStatus(null);
    socketService.reconnect();
  };

  const handlePressureChange = (val: number) => {
    updateTelemetry({ pressure: val }, 'internal_simulator');
    ApiService.ingestSensorReading({
      device_id: 1,
      tank_id: 1,
      distance_cm: 28.0,
      water_level_pct: data.tankLevel,
      flow_rate_lmin: data.flowRate,
      daily_consumption_liters: data.dailyConsumptionLiters,
      tds_ppm: 140.0,
      pressure_bar: val,
    });
  };

  const handleFlowChange = (val: number) => {
    updateTelemetry({ flowRate: val }, 'internal_simulator');
    ApiService.ingestSensorReading({
      device_id: 1,
      tank_id: 1,
      distance_cm: 28.0,
      water_level_pct: data.tankLevel,
      flow_rate_lmin: val,
      daily_consumption_liters: data.dailyConsumptionLiters,
      tds_ppm: 140.0,
      pressure_bar: data.pressure,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View
        style={{
          paddingTop: 48,
          paddingBottom: 12,
          paddingHorizontal: 20,
          backgroundColor: '#071426',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 2 }}>
            HARDWARE
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
            Network Gateway & Actuator Overrides
          </Text>
        </View>

        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: '#0D1B2E',
            borderWidth: 1,
            borderColor: '#1E293B',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sliders size={18} color="#00C2FF" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* --- SECTION 1: SERVER & GATEWAY CONNECTION --- */}
        <Text style={styles.sectionHeader}>Server & Gateway Connection</Text>

        <GlassCard variant="cyan" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Server size={18} color="#00C2FF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>Backend Host Configuration</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flex: 2, marginRight: 8 }}>
              <Text style={styles.inputLabel}>SERVER HOST / IP</Text>
              <TextInput
                value={hostInput}
                onChangeText={setHostInput}
                placeholder="10.10.32.35 or localhost"
                placeholderTextColor="#475569"
                style={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>PORT</Text>
              <TextInput
                value={portInput}
                onChangeText={setPortInput}
                placeholder="8000"
                placeholderTextColor="#475569"
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Action Buttons: Ping & Save */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <TouchableOpacity
              onPress={handleTestPing}
              style={[styles.actionBtn, { backgroundColor: '#1E293B', borderColor: '#334155' }]}
              disabled={pingStatus?.testing}
            >
              {pingStatus?.testing ? (
                <ActivityIndicator size="small" color="#00C2FF" />
              ) : (
                <Text style={[styles.actionBtnText, { color: '#00C2FF' }]}>TEST PING</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveConnection}
              style={[styles.actionBtn, { backgroundColor: '#0284C7', borderColor: '#38BDF8' }]}
            >
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>APPLY & RECONNECT</Text>
            </TouchableOpacity>
          </View>

          {/* Ping Diagnostic Output */}
          {pingStatus && !pingStatus.testing && (
            <View
              style={[
                styles.pingResultBox,
                {
                  backgroundColor: pingStatus.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  borderColor: pingStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                },
              ]}
            >
              {pingStatus.success ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#34D399', fontSize: 11, fontWeight: 'bold' }}>
                    Connected successfully in {pingStatus.latencyMs}ms
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AlertCircle size={14} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#F87171', fontSize: 11, fontWeight: 'bold' }}>
                    Connection unreachable: {pingStatus.error}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Auto-Switch Toggle */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1E293B' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ color: '#E2E8F0', fontWeight: 'bold', fontSize: 12 }}>Auto-prioritize Live Telemetry</Text>
              <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Auto-disable simulation when live WebSocket data is streaming</Text>
            </View>
            <Switch
              value={autoSwitchSimulation}
              onValueChange={setAutoSwitchSimulation}
              trackColor={{ false: '#1E293B', true: '#0284C7' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>

        {/* --- SECTION 2: SIMULATION CONTROLS --- */}
        <Text style={styles.sectionHeader}>Telemetry Simulation</Text>

        <GlassCard variant="slate" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(6, 182, 212, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Radio size={16} color="#00C2FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Autonomous Generator</Text>
                <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                  {isSimulating ? 'Autonomous telemetry generation active' : 'Simulation paused'}
                </Text>
              </View>
            </View>
            <Switch
              value={isSimulating}
              onValueChange={toggleSimulation}
              trackColor={{ false: '#1E293B', true: '#06B6D4' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>

        {/* --- SECTION 3: SENSOR VALUE OVERRIDES --- */}
        <Text style={styles.sectionHeader}>Sensor Calibration & Overrides</Text>

        {/* Pressure Slider */}
        <GlassCard variant="cyan" style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gauge size={16} color="#00C2FF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Pressure Transducer</Text>
            </View>
            <Text style={{ color: '#00C2FF', fontSize: 14, fontWeight: '900', fontFamily: 'monospace' }}>
              {data.pressure.toFixed(1)} BAR
            </Text>
          </View>

          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={8}
            value={data.pressure}
            onValueChange={handlePressureChange}
            minimumTrackTintColor="#06B6D4"
            maximumTrackTintColor="#1E293B"
            thumbTintColor="#00C2FF"
          />
        </GlassCard>

        {/* Flow Slider */}
        <GlassCard variant="cyan" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Activity size={16} color="#38BDF8" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Discharge Flow Rate</Text>
            </View>
            <Text style={{ color: '#38BDF8', fontSize: 14, fontWeight: '900', fontFamily: 'monospace' }}>
              {data.flowRate.toFixed(1)} L/min
            </Text>
          </View>

          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={120}
            value={data.flowRate}
            onValueChange={handleFlowChange}
            minimumTrackTintColor="#38BDF8"
            maximumTrackTintColor="#1E293B"
            thumbTintColor="#38BDF8"
          />
        </GlassCard>

        {/* --- SECTION 4: ACTUATOR CONTROLS --- */}
        <Text style={styles.sectionHeader}>Actuator State Control</Text>

        <GlassCard variant={isFault ? 'red' : 'emerald'} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Power size={16} color={isFault ? '#EF4444' : '#10B981'} style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Main Pump Motor</Text>
            </View>
            <StatusBadge status={isFault ? 'critical' : isRunning ? 'running' : 'idle'} label={data.pumpStatus} size="sm" />
          </View>

          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={() => updateTelemetry({ pumpStatus: 'running' })}
              style={[styles.actuatorBtn, isRunning && { backgroundColor: '#059669', borderColor: '#10B981' }]}
            >
              <Text style={styles.actuatorBtnText}>PUMP START</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updateTelemetry({ pumpStatus: 'stopped' })}
              style={[styles.actuatorBtn, data.pumpStatus === 'stopped' && { backgroundColor: '#334155', borderColor: '#64748B' }]}
            >
              <Text style={styles.actuatorBtnText}>PUMP STOP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updateTelemetry({ pumpStatus: 'fault' })}
              style={[styles.actuatorBtn, isFault && { backgroundColor: '#DC2626', borderColor: '#EF4444' }]}
            >
              <Text style={styles.actuatorBtnText}>FAULT SIM</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Reset Settings Button */}
        <TouchableOpacity
          onPress={handleResetSettings}
          style={styles.resetBtn}
          activeOpacity={0.7}
        >
          <RotateCcw size={14} color="#94A3B8" style={{ marginRight: 6 }} />
          <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: 'bold' }}>Restore Default Network Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = {
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    letterSpacing: 0.6,
  },
  pingResultBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  actuatorBtn: {
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actuatorBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold' as const,
    fontSize: 10,
  },
  resetBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    marginTop: 8,
  },
};
