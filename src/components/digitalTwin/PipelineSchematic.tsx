import React, { useEffect } from 'react';
import { View, Text as RNText } from 'react-native';
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

  const animatedFlowProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const animatedPumpStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // For SVG <G> we must supply a transform attribute string via animatedProps
  const animatedPumpProps = useAnimatedProps(() => ({
    transform: `rotate(${rotation.value})`,
  } as any));

  // Dynamic status color coding
  const getPressureColor = () => {
    if (pressure > 5.5) return '#EF4444'; // Extreme Red
    if (pressure > 4.2) return '#FACC15'; // Medium Warning
    return '#22C55E';                     // Safe Green
  };

  const getPumpColor = () => {
    if (pumpStatus === 'running') return '#22C55E';
    if (pumpStatus === 'fault') return '#EF4444';
    return '#64748B';
  };

  // Water level SVG path calculation
  const tankHeight = 70;
  const fillHeight = (tankLevel / 100) * tankHeight;
  const tankY = 120 - fillHeight;

  return (
    <View className="bg-slate-900 border border-slate-800 rounded-3xl p-4 my-2 shadow-2xl relative overflow-hidden">
      <View className="flex-row justify-between items-center mb-2 px-2">
        <View className="flex-row items-center space-x-2">
          <View className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <RNText className="text-slate-300 font-bold text-xs tracking-wider uppercase">
            SCADA Digital Twin Pipeline Network
          </RNText>
        </View>
        <RNText className="text-cyan-400 text-xs font-mono">FLOW: {flowRate} L/min</RNText>
      </View>

      <Svg viewBox="0 0 380 220" className="w-full h-56">
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
          stroke="#1E293B"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* --- ANIMATED WATER FLOW LAYER --- */}
        <AnimatedPath
          d="M 30 110 L 80 110 M 110 110 L 170 110 L 170 60 L 250 60 L 250 110 L 280 110 M 320 120 L 360 120"
          stroke="url(#waterGrad)"
          strokeWidth="6"
          strokeDasharray="10 6"
          animatedProps={animatedFlowProps}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* --- NODE 1: WATER RESERVOIR --- */}
        <Rect x="10" y="80" width="30" height="60" rx="6" fill="#334155" stroke="#475569" strokeWidth="2" />
        <SvgText x="15" y="152" fill="#94A3B8" fontSize="8" fontWeight="bold">SOURCE</SvgText>

        {/* --- NODE 2: PUMP STATION WITH ROTATING TURBINE --- */}
        <G transform="translate(95, 110)">
          <Circle r="18" fill="#1E293B" stroke={getPumpColor()} strokeWidth="3" />
          {/* Animated Internal Turbine Impeller */}
          <AnimatedG animatedProps={animatedPumpProps}>
            <Circle r="4" fill="#06B6D4" />
            <Path d="M -12 0 L 12 0 M 0 -12 L 0 12" stroke="#06B6D4" strokeWidth="2" />
          </AnimatedG>
        </G>
        <SvgText x="82" y="142" fill="#94A3B8" fontSize="9" fontWeight="bold">PUMP 01</SvgText>

        {/* --- NODE 3: PRESSURE SENSOR --- */}
        <G transform="translate(170, 60)">
          <Circle r="10" fill="#0F172A" stroke={getPressureColor()} strokeWidth="3" />
          <Circle r="4" fill={getPressureColor()} />
        </G>
        <SvgText x="145" y="42" fill="#94A3B8" fontSize="8" fontWeight="bold">
          {pressure.toFixed(1)} BAR
        </SvgText>

        {/* --- NODE 4: FLOW SENSOR --- */}
        <G transform="translate(250, 60)">
          <Rect x="-10" y="-10" width="20" height="20" rx="4" fill="#0F172A" stroke="#06B6D4" strokeWidth="2" />
          <SvgText x="-6" y="4" fill="#06B6D4" fontSize="8" fontWeight="bold">FT</SvgText>
        </G>

        {/* --- NODE 5: ELEVATED VILLAGE STORAGE TANK --- */}
        <Rect x="280" y="50" width="40" height="70" rx="4" fill="#0F172A" stroke="#475569" strokeWidth="2" />
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
        <Circle cx="360" cy="120" r="8" fill="#334155" stroke="#06B6D4" strokeWidth="2" />
        <SvgText x="340" y="140" fill="#94A3B8" fontSize="8" fontWeight="bold">TOWN</SvgText>
      </Svg>
    </View>
  );
};