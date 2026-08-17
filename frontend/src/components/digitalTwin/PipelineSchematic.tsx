import React, { useEffect } from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
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

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

export const PipelineSchematic: React.FC = () => {
  const { data } = useTelemetryStore();
  const { pressure, flowRate, tankLevel, pumpStatus } = data;

  // Animation Controls
  const dashOffset = useSharedValue(0);
  const rotation = useSharedValue(0);
  const dotOpacity = useSharedValue(1);

  // Dynamic animation speed calculated from flow rate with infinite loop guaranteed (-1)
  useEffect(() => {
    const duration = flowRate > 0 ? Math.max(400, 3000 - flowRate * 25) : 2000;
    
    dashOffset.value = 0;
    dashOffset.value = withRepeat(
      withTiming(-40, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [flowRate]);

  // Pump rotational velocity linked to operation state with infinite loop guaranteed (-1)
  useEffect(() => {
    if (pumpStatus === 'running') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1200, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [pumpStatus]);

  // Pulse animation for the status dot
  useEffect(() => {
    dotOpacity.value = withRepeat(
      withTiming(0.3, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedFlowProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const animatedPumpProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  // Dynamic status color coding
  const getPressureColor = () => {
    if (pressure > 5.5) return '#EF4444'; // Extreme Red
    if (pressure > 4.2) return '#FACC15'; // Medium Warning
    return '#4ADE80';                   // Safe Green
  };

  const getPumpColor = () => {
    if (pumpStatus === 'running') return '#4ADE80';
    if (pumpStatus === 'fault') return '#EF4444';
    return '#64748B';
  };

  // Water level SVG path calculation
  const tankHeight = 70;
  const fillHeight = (tankLevel / 100) * tankHeight;
  const tankY = 120 - fillHeight;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={[styles.statusDot, dotAnimatedStyle]} />
          <RNText style={styles.headerTitle}>SCADA Hydraulic Digital Twin</RNText>
        </View>
        <RNText style={styles.flowText}>FLOW: {flowRate.toFixed(1)} L/min</RNText>
      </View>

      <Svg viewBox="0 0 380 220" style={styles.svg}>
        <Defs>
          <LinearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#06B6D4" />
            <Stop offset="100%" stopColor="#3B82F6" />
          </LinearGradient>
          <LinearGradient id="tankWater" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.95" />
          </LinearGradient>
        </Defs>

        {/* --- PIPELINE PATHS (STATIC BASE) --- */}
        <Path
          d="M 30 110 L 80 110 M 110 110 L 170 110 L 170 60 L 250 60 L 250 110 L 280 110 M 320 120 L 360 120"
          stroke="#10233A"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* --- ANIMATED WATER FLOW LAYER --- */}
        <AnimatedPath
          d="M 30 110 L 80 110 M 110 110 L 170 110 L 170 60 L 250 60 L 250 110 L 280 110 M 320 120 L 360 120"
          stroke="url(#waterGrad)"
          strokeWidth="6"
          strokeDasharray={[10, 6]}
          animatedProps={animatedFlowProps}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* --- NODE 1: WATER RESERVOIR --- */}
        <Rect x="10" y="80" width="30" height="60" rx="6" fill="#10233A" stroke="#1E293B" strokeWidth="2" />
        <SvgText x="15" y="152" fill="#94A3B8" fontSize="8" fontWeight="bold">SOURCE</SvgText>

        {/* --- NODE 2: PUMP STATION WITH ROTATING TURBINE --- */}
        <G transform={[{ translateX: 95 }, { translateY: 110 }]}>
          <Circle r="18" fill="#10233A" stroke={getPumpColor()} strokeWidth="3" />
          {/* Animated Internal Turbine Impeller */}
          <AnimatedG animatedProps={animatedPumpProps}>
            <Circle r="4" fill="#00C2FF" />
            <Path d="M -12 0 L 12 0 M 0 -12 L 0 12" stroke="#00C2FF" strokeWidth="2" />
          </AnimatedG>
        </G>
        <SvgText x="82" y="142" fill="#94A3B8" fontSize="9" fontWeight="bold">PUMP 01</SvgText>

        {/* --- NODE 3: PRESSURE SENSOR --- */}
        <G transform={[{ translateX: 170 }, { translateY: 60 }]}>
          <Circle r="10" fill="#10233A" stroke={getPressureColor()} strokeWidth="3" />
          <Circle r="4" fill={getPressureColor()} />
        </G>
        <SvgText x="145" y="42" fill="#94A3B8" fontSize="8" fontWeight="bold">
          {pressure.toFixed(1)} BAR
        </SvgText>

        {/* --- NODE 4: FLOW SENSOR --- */}
        <G transform={[{ translateX: 250 }, { translateY: 60 }]}>
          <Rect x="-10" y="-10" width="20" height="20" rx="4" fill="#10233A" stroke="#00C2FF" strokeWidth="2" />
          <SvgText x="-6" y="4" fill="#00C2FF" fontSize="8" fontWeight="bold">FT</SvgText>
        </G>

        {/* --- NODE 5: ELEVATED VILLAGE STORAGE TANK --- */}
        <Rect x="280" y="50" width="40" height="70" rx="4" fill="#10233A" stroke="#1E293B" strokeWidth="2" />
        <Rect
          x="282"
          y={tankY}
          width="36"
          height={fillHeight}
          rx="2"
          fill="url(#tankWater)"
        />
        <SvgText x="285" y="135" fill="#38BDF8" fontSize="9" fontWeight="bold">
          {tankLevel.toFixed(0)}%
        </SvgText>

        {/* --- NODE 6: CONSUMER DISTRIBUTION NETWORK --- */}
        <Circle cx="360" cy="120" r="8" fill="#10233A" stroke="#00C2FF" strokeWidth="2" />
        <SvgText x="340" y="140" fill="#94A3B8" fontSize="8" fontWeight="bold">TOWN</SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#10233A',      // Upgraded to match industrial card containers
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)', // Subtle cyan border glow
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C2FF',      // Matching industrial cyan
    marginRight: 8,
  },
  headerTitle: {
    color: '#FFFFFF',                // Clean white header
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  flowText: {
    color: '#38BDF8',                // Bright blue badge
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  svg: {
    width: '100%',
    height: 220,
  },
});