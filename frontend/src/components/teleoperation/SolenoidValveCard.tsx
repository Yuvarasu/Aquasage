import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Sliders, CheckCircle2, CircleDot } from 'lucide-react-native';
import { useActuatorStore } from '../../store/useActuatorStore';
import { GlassCard } from '../ui/GlassCard';
import { StatusBadge } from '../ui/StatusBadge';

export const SolenoidValveCard: React.FC = () => {
  const { valvePositionPct, valveState, setValvePosition, isEmergencyStopped } = useActuatorStore();

  const presets = [
    { label: 'CLOSED (0%)', val: 0 },
    { label: '50% THROTTLE', val: 50 },
    { label: 'FULL BORE (100%)', val: 100 },
  ];

  const getStatusVariant = () => {
    if (valveState === 'OPEN') return 'online';
    if (valveState === 'PARTIAL') return 'warning';
    return 'offline';
  };

  return (
    <GlassCard variant="cyan" style={{ marginBottom: 14 }} padding={16}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.iconBox}>
            <CircleDot size={18} color="#00C2FF" />
          </View>
          <View>
            <Text style={styles.title}>Motorized Solenoid Header Valve</Text>
            <Text style={styles.subtitle}>Node: VALVE-SOL-01 • Direct Flow Control</Text>
          </View>
        </View>

        <StatusBadge
          status={isEmergencyStopped ? 'critical' : getStatusVariant()}
          label={isEmergencyStopped ? 'SHUT' : valveState}
          size="sm"
        />
      </View>

      {/* Valve Orifice Readout */}
      <View style={styles.orificeRow}>
        <Text style={styles.label}>ORIFICE APERTURE</Text>
        <Text style={styles.value}>{valvePositionPct}%</Text>
      </View>

      {/* Orifice Slider */}
      <Slider
        style={{ width: '100%', height: 38 }}
        minimumValue={0}
        maximumValue={100}
        step={5}
        value={valvePositionPct}
        onValueChange={setValvePosition}
        disabled={isEmergencyStopped}
        minimumTrackTintColor="#00C2FF"
        maximumTrackTintColor="#1E293B"
        thumbTintColor="#00C2FF"
      />
      <View style={styles.sliderTicks}>
        <Text style={styles.tickText}>0% (ISOLATED)</Text>
        <Text style={styles.tickText}>50%</Text>
        <Text style={styles.tickText}>100% (FULL OPEN)</Text>
      </View>

      {/* Presets */}
      <View style={styles.presetRow}>
        {presets.map((p, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setValvePosition(p.val)}
            disabled={isEmergencyStopped}
            style={[
              styles.presetBtn,
              valvePositionPct === p.val && styles.presetBtnActive,
              isEmergencyStopped && { opacity: 0.4 },
            ]}
          >
            <Text style={[styles.presetText, valvePositionPct === p.val && styles.presetTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
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
  orificeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  label: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  value: {
    color: '#00C2FF',
    fontSize: 22,
    fontWeight: '900',
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
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#00C2FF',
  },
  presetText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  presetTextActive: {
    color: '#00C2FF',
  },
});
