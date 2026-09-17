import React, { useEffect, useState } from 'react';
import { View, Text as RNText, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Path, Rect, Circle, G, Defs, LinearGradient, Stop, Text as SvgText, Line,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { FlowSensorNode } from './FlowSensorNode';
import { SensorProbeNode } from './SensorProbeNode';
import { FiltrationCanisterNode } from './FiltrationCanisterNode';
import { NodeDetailModal, NodeType } from './NodeDetailModal';
import { hapticsService } from '../../services/hapticsService';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ---------------------------------------------------------------------------
// LAYOUT
// ---------------------------------------------------------------------------
const VIEW_W = 500;
const VIEW_H = 260;

// Tank
const TANK_CX = 55;
const TANK_TOP = 32;
const TANK_W = 62;
const TANK_H = 50;
const TANK_OUTLET_Y = 102;

// Main pipe
const PIPE_Y = 140;
const PIPE_THICK = 12;

// X positions
const DROP_X = 55;
const SENSE_X = 120;
const FT01_X = 200;
const FILT_X = 280;
const FT02_X = 360;

// Village hut — SMALLER now
const VILLAGE_CX = 458;
const HUT_BODY_W = 34;                             // was 48
const HUT_BODY_H = 30;                             // was 44
const HUT_LEFT_WALL = VILLAGE_CX - HUT_BODY_W / 2; // = 441
const PIPE_END_X = VILLAGE_CX - 4;                 // pipe reaches into hut

// Flow dashes
const DASH = [14, 9];
const DASH_TRAVEL = -23 * 4;

export const PipelineSchematic: React.FC = () => {
  const { data } = useTelemetryStore();
  const {
    flowRate, tankLevel,
    waterTurbidityNTU, pHLevel, tdsLevel,
  } = data;

  const ft01 = flowRate;
  const ft02 = Math.max(0, flowRate * 0.97);

  const waterGood =
    waterTurbidityNTU < 1.0 && pHLevel >= 6.5 && pHLevel <= 8.5 && tdsLevel < 600;

  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);

  const mainDash = useSharedValue(0);
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    if (flowRate > 0) {
      const duration = Math.max(600, 2200 - flowRate * 14);
      mainDash.value = 0;
      mainDash.value = withRepeat(
        withTiming(DASH_TRAVEL, { duration, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      mainDash.value = 0;
    }
  }, [flowRate]);

  useEffect(() => {
    dotOpacity.value = withRepeat(withTiming(0.3, { duration: 1000 }), -1, true);
  }, []);

  const mainFlowProps = useAnimatedProps(() => ({ strokeDashoffset: mainDash.value }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={[styles.statusDot, dotStyle]} />
          <RNText style={styles.headerTitle}>Digital Twin</RNText>
        </View>
        <RNText style={styles.tapTip}>TAP NODE TO INSPECT</RNText>
      </View>

      <View style={{ position: 'relative' }}>
        <Svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={styles.svg}
        >
          <Defs>
            <LinearGradient id="pipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#243449" />
              <Stop offset="50%" stopColor="#1E293B" />
              <Stop offset="100%" stopColor="#0B1220" />
            </LinearGradient>
            <LinearGradient id="tankBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#1E293B" />
              <Stop offset="100%" stopColor="#0B1220" />
            </LinearGradient>
            <LinearGradient id="tankWater" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#1E40AF" />
            </LinearGradient>
            <LinearGradient id="hutRoof" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#10B981" />
              <Stop offset="100%" stopColor="#047857" />
            </LinearGradient>
            <LinearGradient id="hutBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#1E293B" />
              <Stop offset="100%" stopColor="#0B1220" />
            </LinearGradient>
          </Defs>

          {/* OVERHEAD TANK */}
          <SvgText
            x={TANK_CX}
            y={14}
            fill="#94A3B8"
            fontSize="7.5"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
            letterSpacing="0.6"
          >
            OVERHEAD TANK
          </SvgText>

          <G transform={[{ translateX: TANK_CX }, { translateY: TANK_TOP }]}>
            <Path
              d={`M ${-TANK_W / 2 + 8} ${TANK_H} L ${-TANK_W / 2 + 2} ${TANK_H + 22}
                  M ${TANK_W / 2 - 8} ${TANK_H} L ${TANK_W / 2 - 2} ${TANK_H + 22}
                  M ${-TANK_W / 2 + 2} ${TANK_H + 22} L ${TANK_W / 2 - 2} ${TANK_H + 22}`}
              stroke="#334155"
              strokeWidth="2.2"
              fill="none"
            />
            <Rect
              x={-TANK_W / 2}
              y={0}
              width={TANK_W}
              height={TANK_H}
              rx={4}
              fill="url(#tankBody)"
              stroke="#475569"
              strokeWidth="1.8"
            />
            <Rect
              x={-TANK_W / 2 + 3}
              y={3 + (TANK_H - 6) * (1 - tankLevel / 100)}
              width={TANK_W - 6}
              height={Math.max(0, (TANK_H - 6) * (tankLevel / 100))}
              rx={2}
              fill="url(#tankWater)"
            />
            <Rect
              x={-TANK_W / 2 + 3}
              y={3}
              width={3}
              height={TANK_H - 6}
              fill="#FFFFFF"
              opacity={0.08}
            />
            <Rect
              x={-TANK_W / 2 - 5}
              y={-6}
              width={TANK_W + 10}
              height={8}
              rx={3}
              fill="#1E293B"
              stroke="#475569"
              strokeWidth="1.2"
            />
            <SvgText
              x="0"
              y={TANK_H / 2 + 6}
              fill="#FFFFFF"
              fontSize="14"
              fontWeight="900"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {tankLevel.toFixed(0)}%
            </SvgText>
          </G>

          {/* VERTICAL DROP PIPE */}
          <Rect
            x={DROP_X - PIPE_THICK / 2}
            y={TANK_OUTLET_Y}
            width={PIPE_THICK}
            height={PIPE_Y - TANK_OUTLET_Y}
            fill="url(#pipeGrad)"
            stroke="#334155"
            strokeWidth="1"
          />
          <Rect
            x={DROP_X - PIPE_THICK / 2 + 2}
            y={TANK_OUTLET_Y + 2}
            width={2}
            height={PIPE_Y - TANK_OUTLET_Y - 4}
            fill="#FFFFFF"
            opacity={0.08}
          />
          {flowRate > 0 && (
            <>
              <Path
                d={`M ${DROP_X} ${TANK_OUTLET_Y + 4} L ${DROP_X} ${PIPE_Y - 4}`}
                stroke="#00C2FF"
                strokeWidth="14"
                opacity="0.18"
                strokeLinecap="round"
              />
              <AnimatedPath
                d={`M ${DROP_X} ${TANK_OUTLET_Y + 4} L ${DROP_X} ${PIPE_Y - 4}`}
                stroke="#00E5FF"
                strokeWidth="6"
                strokeDasharray={DASH}
                animatedProps={mainFlowProps}
                strokeLinecap="round"
              />
            </>
          )}
          <Circle cx={DROP_X} cy={PIPE_Y} r={PIPE_THICK / 2 + 1} fill="#0B1220" stroke="#334155" strokeWidth="1" />

          {/* BALL VALVE */}
          <G transform={[{ translateX: DROP_X }, { translateY: TANK_OUTLET_Y + 28 }]}>
            <Rect x="-11" y="-8" width="22" height="16" rx="3" fill="#0D1B2E" stroke="#38BDF8" strokeWidth="2" />
            <Circle r="3.2" fill="#38BDF8" />
            <Rect x="-2.5" y="-17" width="5" height="9" fill="#38BDF8" />
            <Rect x="-9" y="-19" width="18" height="4" rx="2" fill="#38BDF8" />
          </G>
          <SvgText
            x={DROP_X - 16}
            y={TANK_OUTLET_Y + 32}
            fill="#38BDF8"
            fontSize="6.5"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="end"
          >
            BALL VALVE
          </SvgText>

          {/* MAIN HORIZONTAL PIPE — extends into the hut */}
          <Rect
            x={DROP_X - PIPE_THICK / 2}
            y={PIPE_Y - PIPE_THICK / 2}
            width={PIPE_END_X - (DROP_X - PIPE_THICK / 2)}
            height={PIPE_THICK}
            rx={PIPE_THICK / 2}
            fill="url(#pipeGrad)"
            stroke="#334155"
            strokeWidth="1"
          />
          <Rect
            x={DROP_X}
            y={PIPE_Y - PIPE_THICK / 2 + 2}
            width={HUT_LEFT_WALL - DROP_X}
            height={2}
            fill="#FFFFFF"
            opacity={0.07}
          />

          {/* T-JUNCTIONS */}
          {[SENSE_X, FILT_X].map((cx, i) => (
            <G key={`tj-${i}`}>
              <Rect
                x={cx - 9}
                y={PIPE_Y - PIPE_THICK / 2 - 3}
                width={18}
                height={PIPE_THICK + 6}
                rx={3}
                fill="#1E293B"
                stroke="#64748B"
                strokeWidth="1"
              />
              <Rect
                x={cx - 5}
                y={PIPE_Y + PIPE_THICK / 2 - 1}
                width={10}
                height={12}
                rx={1.5}
                fill="#1E293B"
                stroke="#64748B"
                strokeWidth="1"
              />
              <Rect
                x={cx - 7}
                y={PIPE_Y + PIPE_THICK / 2 + 10}
                width={14}
                height={5}
                rx={1.5}
                fill="#1E293B"
                stroke="#64748B"
                strokeWidth="1"
              />
            </G>
          ))}

          {/* Joint rings for inline flow sensors */}
          {[FT01_X, FT02_X].map((cx, i) => (
            <Rect
              key={`jr-${i}`}
              x={cx - 3}
              y={PIPE_Y - PIPE_THICK / 2 - 2}
              width={6}
              height={PIPE_THICK + 4}
              rx={2}
              fill="#0B1220"
              stroke="#475569"
              strokeWidth="0.8"
            />
          ))}

          {/* CONTINUOUS FLOW */}
          {flowRate > 0 && (
            <>
              <Path
                d={`M ${DROP_X + 6} ${PIPE_Y} L ${HUT_LEFT_WALL} ${PIPE_Y}`}
                stroke="#00C2FF"
                strokeWidth="16"
                opacity="0.18"
                strokeLinecap="round"
              />
              <AnimatedPath
                d={`M ${DROP_X + 6} ${PIPE_Y} L ${HUT_LEFT_WALL} ${PIPE_Y}`}
                stroke="#00E5FF"
                strokeWidth="7"
                strokeDasharray={DASH}
                animatedProps={mainFlowProps}
                strokeLinecap="round"
              />
              <AnimatedPath
                d={`M ${DROP_X + 6} ${PIPE_Y} L ${HUT_LEFT_WALL} ${PIPE_Y}`}
                stroke="#E0FFFF"
                strokeWidth="2"
                strokeDasharray={DASH}
                animatedProps={mainFlowProps}
                strokeLinecap="round"
                opacity="0.8"
              />
            </>
          )}

          {/* SENSING UNIT */}
          <Line
            x1={SENSE_X}
            y1={PIPE_Y + PIPE_THICK / 2 + 14}
            x2={SENSE_X}
            y2={PIPE_Y + 32}
            stroke="#475569"
            strokeWidth="2.4"
          />
          <Circle cx={SENSE_X} cy={PIPE_Y + PIPE_THICK / 2 + 14} r="2.8" fill="#00C2FF" />
          <SensorProbeNode
            x={SENSE_X}
            y={PIPE_Y + 32}
            accent="#00C2FF"
            readings={[
              { tag: 'TURB', value: `${waterTurbidityNTU.toFixed(2)}`, unit: 'NTU', alert: waterTurbidityNTU > 1.0 },
              { tag: 'TDS', value: `${tdsLevel.toFixed(0)}`, unit: 'ppm', alert: tdsLevel > 600 },
              { tag: 'pH', value: `${pHLevel.toFixed(1)}`, unit: 'pH', alert: pHLevel < 6.5 || pHLevel > 8.5 },
            ]}
            verdict={waterGood ? 'GOOD' : 'CONTAMINATED'}
          />

          {/* FT-01 */}
          <FlowSensorNode
            x={FT01_X}
            y={PIPE_Y}
            tag="FT-01"
            valueText={`${ft01.toFixed(1)}`}
            unitText="L/min"
            color="#38BDF8"
          />

          {/* FILTRATION UNIT */}
          <Line
            x1={FILT_X}
            y1={PIPE_Y + PIPE_THICK / 2 + 14}
            x2={FILT_X}
            y2={PIPE_Y + 44}
            stroke="#475569"
            strokeWidth="2.6"
          />
          <FiltrationCanisterNode x={FILT_X} y={PIPE_Y + 68} active={!waterGood} />

          {/* FT-02 */}
          <FlowSensorNode
            x={FT02_X}
            y={PIPE_Y}
            tag="FT-02"
            valueText={`${ft02.toFixed(1)}`}
            unitText="L/min"
            color="#22D3EE"
          />

          {/* VILLAGE HUT — SMALLER */}
          <G transform={[{ translateX: VILLAGE_CX }, { translateY: PIPE_Y }]}>
            {/* Hut body */}
            <Rect
              x={-HUT_BODY_W / 2}
              y={-HUT_BODY_H / 2}
              width={HUT_BODY_W}
              height={HUT_BODY_H}
              rx={1.2}
              fill="url(#hutBody)"
              stroke="#10B981"
              strokeWidth="1.4"
            />

            {/* Roof triangle (smaller) */}
            <Path
              d={`M ${-HUT_BODY_W / 2 - 5} ${-HUT_BODY_H / 2} L 0 ${-HUT_BODY_H / 2 - 14} L ${HUT_BODY_W / 2 + 5} ${-HUT_BODY_H / 2} Z`}
              fill="url(#hutRoof)"
              stroke="#10B981"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Roof ridge highlight */}
            <Path
              d={`M ${-HUT_BODY_W / 2 - 1} ${-HUT_BODY_H / 2 - 1} L 0 ${-HUT_BODY_H / 2 - 12} L ${HUT_BODY_W / 2 + 1} ${-HUT_BODY_H / 2 - 1}`}
              stroke="#6EE7B7"
              strokeWidth="0.7"
              opacity="0.5"
              fill="none"
            />

            {/* Door */}
            <Rect x="-2.5" y="-1" width="6" height="16" rx="0.5" fill="#0D1B2E" stroke="#10B981" strokeWidth="0.7" />

            {/* Round window */}
            <Circle cx="9" cy="-5" r="2" fill="#38BDF8" opacity="0.85" />

            {/* Chimney */}
            <Rect x="10" y="-28" width="4" height="10" fill="#0B1220" stroke="#10B981" strokeWidth="0.7" />

            {/* Pipe entry port on left wall */}
            <Rect
              x={-HUT_BODY_W / 2 - 3}
              y={-5}
              width={6}
              height={10}
              rx={1.5}
              fill="#1E293B"
              stroke="#10B981"
              strokeWidth="1"
            />
            {/* Connection dot */}
            <Circle cx={-HUT_BODY_W / 2} cy={0} r="2.2" fill="#10B981" />

            {/* Labels below hut */}
            <SvgText
              x="0"
              y={HUT_BODY_H / 2 + 14}
              fill="#10B981"
              fontSize="7.5"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              letterSpacing="0.5"
            >
              VILLAGE
            </SvgText>
            <SvgText
              x="0"
              y={HUT_BODY_H / 2 + 24}
              fill="#64748B"
              fontSize="6"
              fontFamily="monospace"
              textAnchor="middle"
            >
              142 CONN
            </SvgText>
          </G>
        </Svg>

        {/* TOUCH ZONES */}
        <TouchableOpacity
          style={[styles.touchZone, { left: '5%', top: 25, width: 90, height: 120 }]}
          onPress={() => { hapticsService.tapLight(); setSelectedNode('SOURCE_RESERVOIR'); }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: '8%', top: 115, width: 50, height: 55 }]}
          onPress={() => { hapticsService.tapLight(); setSelectedNode('BALL_VALVE'); }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: '20%', top: 170, width: 62, height: 100 }]}
          onPress={() => { hapticsService.tapLight(); setSelectedNode('SENSING_UNIT'); }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: '36%', top: 115, width: 46, height: 70 }]}
          onPress={() => { hapticsService.tapLight(); setSelectedNode('FLOW_SEN_01'); }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: '52%', top: 180, width: 60, height: 100 }]}
          onPress={() => { hapticsService.tapLight(); setSelectedNode('FILTRATION_UNIT'); }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: '68%', top: 115, width: 46, height: 70 }]}
          onPress={() => { hapticsService.tapLight(); setSelectedNode('FLOW_SEN_02'); }}
          activeOpacity={0.6}
        />
        <TouchableOpacity
          style={[styles.touchZone, { left: '88%', top: 105, width: 45, height: 80 }]}
          onPress={() => { hapticsService.tapLight(); setSelectedNode('TOWN_GRID'); }}
          activeOpacity={0.6}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1B2E',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderRadius: 20,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  statusDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#00C2FF', marginRight: 6,
  },
  headerTitle: {
    color: '#FFFFFF', fontWeight: 'bold', fontSize: 12,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  tapTip: {
    color: '#00C2FF', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  svg: { width: '100%', height: 280 },
  touchZone: { position: 'absolute', backgroundColor: 'transparent' },
});