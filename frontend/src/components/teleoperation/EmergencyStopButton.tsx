import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ShieldAlert, Octagon, RotateCcw, AlertTriangle } from 'lucide-react-native';
import { useActuatorStore } from '../../store/useActuatorStore';
import { GlassCard } from '../ui/GlassCard';
import { hapticsService } from '../../services/hapticsService';

export const EmergencyStopButton: React.FC = () => {
  const { isEmergencyStopped, triggerEmergencyStop, resetEmergencyStop } = useActuatorStore();
  const [holding, setHolding] = useState(false);
  const holdProgress = useSharedValue(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = () => {
    if (isEmergencyStopped) return;
    hapticsService.tapHeavy();
    setHolding(true);
    holdProgress.value = withTiming(1, { duration: 1800, easing: Easing.linear });

    holdTimer.current = setTimeout(() => {
      hapticsService.critical();
      triggerEmergencyStop();
      setHolding(false);
      holdProgress.value = 0;
    }, 1800);
  };

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHolding(false);
    holdProgress.value = withTiming(0, { duration: 200 });
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${holdProgress.value * 100}%`,
  }));

  if (isEmergencyStopped) {
    return (
      <GlassCard variant="red" style={{ marginBottom: 14 }} padding={16}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Octagon size={22} color="#EF4444" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>
              MASTER EMERGENCY STOP ENGAGED
            </Text>
            <Text style={{ color: '#FCA5A5', fontSize: 10, marginTop: 1 }}>
              All pumps halted. Solenoid valves forced shut.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={resetEmergencyStop}
          style={styles.resetBtn}
          activeOpacity={0.8}
        >
          <RotateCcw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.resetBtnText}>CLEAR & RESET E-STOP INTERLOCK</Text>
        </TouchableOpacity>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="amber" style={{ marginBottom: 14 }} padding={16}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AlertTriangle size={18} color="#F59E0B" style={{ marginRight: 8 }} />
          <View>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Master Safety Guard</Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}>
              Hold button 2 seconds to trigger emergency cutoff
            </Text>
          </View>
        </View>
      </View>

      {/* Press and Hold Target Container */}
      <Pressable
        onPressIn={startHold}
        onPressOut={cancelHold}
        style={styles.eStopButton}
      >
        {/* Animated Progress Fill */}
        <Animated.View style={[styles.progressFill, progressStyle]} />

        <View style={styles.buttonContent}>
          <ShieldAlert size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>
            {holding ? 'HOLDING... (RELEASING CANCELS)' : 'HOLD FOR EMERGENCY STOP'}
          </Text>
        </View>
      </Pressable>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  eStopButton: {
    height: 48,
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#DC2626',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.6,
  },
});
