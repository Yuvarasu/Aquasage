import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Fan, Power, Zap, RotateCcw } from 'lucide-react-native';
import { useActuatorStore } from '../../store/useActuatorStore';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { GlassCard } from '../ui/GlassCard';
import { StatusBadge } from '../ui/StatusBadge';
import { hapticsService } from '../../services/hapticsService';

export const PumpVfdCard: React.FC = () => {
  const { pumpTargetRPM, setPumpRPM, isEmergencyStopped } = useActuatorStore();
  const { data } = useTelemetryStore();
  const isRunning = data.pumpStatus === 'running' && !isEmergencyStopped;

  const presets = [
    { label: 'ECO (900)', rpm: 900 },
    { label: 'NOMINAL (1450)', rpm: 1450 },
    { label: 'BOOST (1750)', rpm: 1750 },
  ];

  const handleSelectPreset = (rpm: number) => {
    hapticsService.tapMedium();
    setPumpRPM(rpm);
  };

  const handleToggleMotor = () => {
    hapticsService.tapHeavy();
    setPumpRPM(isRunning ? 0 : 1450);
  };


  return (
    <GlassCard variant={isRunning ? 'emerald' : 'slate'} style={{ marginBottom: 14 }} padding={16}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconBox, { backgroundColor: isRunning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)' }]}>
            <Fan size={18} color={isRunning ? '#10B981' : '#94A3B8'} />
          </View>
          <View>
            <Text style={styles.title}>Booster Pump VFD Driver</Text>
            <Text style={styles.subtitle}>Node: PUMP-VFD-01 • 3-Phase Induction</Text>
          </View>
        </View>

        <StatusBadge
          status={isEmergencyStopped ? 'critical' : isRunning ? 'running' : 'offline'}
          label={isEmergencyStopped ? 'E-STOP' : isRunning ? 'RUNNING' : 'STANDBY'}
          size="sm"
        />
      </View>

      {/* Speed Readout & Tachometer */}
      <View style={styles.speedRow}>
        <View>
          <Text style={styles.speedLabel}>TARGET VELOCITY</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.speedValue}>{pumpTargetRPM}</Text>
            <Text style={styles.speedUnit}>RPM</Text>
          </View>
        </View>

        <View style={styles.powerBox}>
          <Zap size={13} color="#F59E0B" style={{ marginRight: 4 }} />
          <Text style={styles.powerText}>
            {isRunning ? `${((pumpTargetRPM / 1500) * 4.8).toFixed(1)} kW` : '0.0 kW'}
          </Text>
        </View>
      </View>

      {/* RPM Slider */}
      <Slider
        style={{ width: '100%', height: 38 }}
        minimumValue={0}
        maximumValue={1800}
        step={50}
        value={pumpTargetRPM}
        onValueChange={setPumpRPM}
        disabled={isEmergencyStopped}
        minimumTrackTintColor="#10B981"
        maximumTrackTintColor="#1E293B"
        thumbTintColor="#10B981"
      />
      <View style={styles.sliderTicks}>
        <Text style={styles.tickText}>0 RPM (STOP)</Text>
        <Text style={styles.tickText}>900</Text>
        <Text style={styles.tickText}>1800 RPM (MAX)</Text>
      </View>

      {/* Preset Quick Buttons */}
      <View style={styles.presetRow}>
        {presets.map((p, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleSelectPreset(p.rpm)}
            disabled={isEmergencyStopped}
            style={[
              styles.presetBtn,
              pumpTargetRPM === p.rpm && styles.presetBtnActive,
              isEmergencyStopped && { opacity: 0.4 },
            ]}
          >
            <Text style={[styles.presetText, pumpTargetRPM === p.rpm && styles.presetTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Toggle Start/Stop Button */}
      <TouchableOpacity
        onPress={handleToggleMotor}
        disabled={isEmergencyStopped}
        style={[
          styles.mainActionBtn,
          { backgroundColor: isRunning ? '#DC2626' : '#059669' },
          isEmergencyStopped && { opacity: 0.4 },
        ]}
        activeOpacity={0.8}
      >
        <Power size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.mainActionText}>
          {isRunning ? 'HALT PUMP MOTOR' : 'ENGAGE PUMP (1450 RPM)'}
        </Text>
      </TouchableOpacity>

    </GlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  speedLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  speedValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  speedUnit: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  powerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  powerText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  tickText: {
    color: '#64748B',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  presetText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  presetTextActive: {
    color: '#10B981',
  },
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  mainActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
});
