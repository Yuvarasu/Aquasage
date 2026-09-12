import React, { useEffect, useState } from 'react';
import { View, Text as RNText, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { AnimatedPumpNode } from './AnimatedPumpNode';
import { FluidTankNode } from './FluidTankNode';
import { SensorGlowNode } from './SensorGlowNode';
import { NodeDetailModal, NodeType } from './NodeDetailModal';
import { hapticsService } from '../../services/hapticsService';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const PipelineSchematic: React.FC = () => {
  const { data } = useTelemetryStore();
  const { pressure, flowRate, tankLevel, pumpStatus, pumpRPM, leakProbability } = data;

  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);

  // Animation Controls
  const dashOffset = useSharedValue(0);
  const dotOpacity = useSharedValue(1);
  const leakPulse = useSharedValue(1);

  // Dynamic animation speed calculated from flow rate
  useEffect(() => {
    if (flowRate > 0) {
      const duration = Math.max(300, 2600 - flowRate * 22);
      dashOffset.value = 0;
      dashOffset.value = withRepeat(
        withTiming(-40, { duration, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      dashOffset.value = 0;
    }
  }, [flowRate]);

  // Pulse animation for status indicator
  useEffect(() => {
    dotOpacity.value = withRepeat(withTiming(0.3, { duration: 1000 }), -1, true);
  }, []);

  // Anomaly leak pulse
  const isLeakHigh = leakProbability > 0.4;
  useEffect(() => {
    if (isLeakHigh) {
      leakPulse.value = withRepeat(withTiming(1.8, { duration: 600 }), -1, true);
    } else {
      leakPulse.value = 1;
    }
  }, [isLeakHigh]);

  const animatedFlowProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  // Dynamic status color coding
  const getPressureColor = () => {
    if (pressure > 5.5) return '#EF4444'; // Red
    if (pressure > 4.2) return '#F59E0B'; // Amber
    return '#00C2FF';                   // Cyan
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={[styles.statusDot, dotAnimatedStyle]} />
          <RNText style={styles.headerTitle}>Digital Twin</RNText>
        </View>
        <View style={styles.headerRight}>
          <RNText style={styles.tapTip}>TAP NODE TO INSPECT</RNText>
        </View>
      </View>

      {/* SVG Canvas */}
      <View style={{ position: 'relative' }}>
        <Svg viewBox="0 0 380 210" style={styles.svg}>
          <Defs>
            <LinearGradient id="waterFlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#06B6D4" />
              <Stop offset="50%" stopColor="#3B82F6" />
              <Stop offset="100%" stopColor="#00C2FF" />
            </LinearGradient>
          </Defs>

          {/* --- BASE PIPELINE (Dark Steel) --- */}
          <Path
            d="M 28 110 L 80 110 M 110 110 L 165 110 L 165 60 L 235 60 L 235 110 L 275 110 M 325 115 L 355 115"
            stroke="#10233A"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* --- ANIMATED FLOW LAYER --- */}
          {flowRate > 0 && (
            <AnimatedPath
              d="M 28 110 L 80 110 M 110 110 L 165 110 L 165 60 L 235 60 L 235 110 L 275 110 M 325 115 L 355 115"
              stroke="url(#waterFlowGrad)"
              strokeWidth="5"
              strokeDasharray={[8, 5]}
              animatedProps={animatedFlowProps}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* --- NODE 1: SOURCE RESERVOIR --- */}
          <G transform={[{ translateX: 14 }, { translateY: 78 }]}>
            <Rect width="26" height="58" rx="5" fill="#0D1B2E" stroke="#334155" strokeWidth="2" />
            <Rect x="3" y="15" width="20" height="40" rx="3" fill="rgba(6, 182, 212, 0.4)" />
            <SvgText x="13" y="68" fill="#94A3B8" fontSize="7.5" fontWeight="bold" textAnchor="middle">
              SOURCE
            </SvgText>
          </G>

          {/* --- NODE 2: PUMP STATION --- */}
          <AnimatedPumpNode
            x={95}
            y={110}
            status={pumpStatus}
            rpm={pumpRPM}
          />

          {/* --- NODE 3: PRESSURE SENSOR (PT-01) --- */}
          <SensorGlowNode
            x={165}
            y={58}
            tag="PT-01"
            valueText={`${pressure.toFixed(1)}`}
            unitText="BAR"
            color={getPressureColor()}
            isAlert={pressure > 5.0}
          />

          {/* --- NODE 4: FLOW SENSOR (FT-01) --- */}
          <SensorGlowNode
            x={235}
            y={58}
            tag="FT-01"
            valueText={`${flowRate.toFixed(0)}`}
            unitText="L/min"
            color="#38BDF8"
          />

          {/* --- NODE 5: ELEVATED VILLAGE TANK --- */}
          <FluidTankNode
            x={275}
            y={42}
            width={46}
            height={72}
            levelPercent={tankLevel}
            capacityLiters={50000}
          />

          {/* --- NODE 6: TOWN DISTRIBUTION GRID --- */}
          <G transform={[{ translateX: 355 }, { translateY: 115 }]}>
            <Circle r="12" fill="#0D1B2E" stroke="#10B981" strokeWidth="2" />
            <Circle r="5" fill="#10B981" />
            <SvgText x="0" y="24" fill="#94A3B8" fontSize="7.5" fontWeight="bold" textAnchor="middle">
              TOWN
            </SvgText>
            <SvgText x="0" y="32" fill="#10B981" fontSize="6.5" fontFamily="monospace" textAnchor="middle">
              142 CONN
            </SvgText>
          </G>
        </Svg>

        {/* --- INVISIBLE TOUCH HIT ZONES FOR DIRECT TAP INSPECTION --- */}
        <TouchableOpacity
          style={[styles.touchZone, { left: 8, top: 60, width: 44, height: 90 }]}
          onPress={() => {
            hapticsService.tapLight();
            setSelectedNode('SOURCE_RESERVOIR');
          }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: 70, top: 70, width: 55, height: 90 }]}
          onPress={() => {
            hapticsService.tapLight();
            setSelectedNode('PUMP_01');
          }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: 140, top: 15, width: 52, height: 85 }]}
          onPress={() => {
            hapticsService.tapLight();
            setSelectedNode('PRESSURE_SEN_01');
          }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: 210, top: 15, width: 52, height: 85 }]}
          onPress={() => {
            hapticsService.tapLight();
            setSelectedNode('FLOW_SEN_01');
          }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: 270, top: 30, width: 56, height: 110 }]}
          onPress={() => {
            hapticsService.tapLight();
            setSelectedNode('VILLAGE_TANK');
          }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: 335, top: 80, width: 42, height: 80 }]}
          onPress={() => {
            hapticsService.tapLight();
            setSelectedNode('TOWN_GRID');
          }}
          activeOpacity={0.6}
        />
      </View>

      {/* --- NODE DETAIL MODAL --- */}
      <NodeDetailModal
        visible={!!selectedNode}
        nodeType={selectedNode}
        telemetry={data}
        onClose={() => setSelectedNode(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1B2E',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderRadius: 20,
    padding: 14,
    marginVertical: 6,
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00C2FF',
    marginRight: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tapTip: {
    color: '#00C2FF',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  svg: {
    width: '100%',
    height: 210,
  },
  touchZone: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});