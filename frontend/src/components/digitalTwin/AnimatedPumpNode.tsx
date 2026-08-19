import React, { useEffect } from 'react';
import { G, Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { PumpStatus } from '../../types/telemetry';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface AnimatedPumpNodeProps {
  x: number;
  y: number;
  status: PumpStatus;
  rpm: number;
  onPress?: () => void;
}

export const AnimatedPumpNode: React.FC<AnimatedPumpNodeProps> = ({
  x,
  y,
  status,
  rpm,
}) => {
  const rotation = useSharedValue(0);
  const haloOpacity = useSharedValue(0.3);

  // Impeller rotation synced with pump status and RPM
  useEffect(() => {
    if (status === 'running') {
      const duration = Math.max(400, Math.min(2500, (1500 / Math.max(rpm, 400)) * 1000));
      rotation.value = withRepeat(
        withTiming(360, { duration, easing: Easing.linear }),
        -1,
        false
      );
      haloOpacity.value = withRepeat(
        withTiming(0.7, { duration: 800 }),
        -1,
        true
      );
    } else {
      rotation.value = 0;
      haloOpacity.value = 0.2;
    }
  }, [status, rpm]);

  const animatedImpellerProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedHaloProps = useAnimatedProps(() => ({
    opacity: haloOpacity.value,
  }));

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return '#10B981'; // Emerald Green
      case 'fault':
        return '#EF4444'; // Crimson Red
      case 'stopped':
      default:
        return '#64748B'; // Slate Grey
    }
  };

  const statusColor = getStatusColor();

  return (
    <G transform={[{ translateX: x }, { translateY: y }]}>
      {/* Outer Glow Halo */}
      <AnimatedCircle
        r="24"
        fill="none"
        stroke={statusColor}
        strokeWidth="2"
        strokeDasharray={[4, 4]}
        animatedProps={animatedHaloProps}
      />

      {/* Pump Body Base */}
      <Rect
        x="-14"
        y="12"
        width="28"
        height="6"
        rx="2"
        fill="#1E293B"
        stroke="#334155"
        strokeWidth="1"
      />

      {/* Main Casing */}
      <Circle
        r="18"
        fill="#0D1B2E"
        stroke={statusColor}
        strokeWidth="2.5"
      />

      {/* Rotating 4-Blade Impeller */}
      <AnimatedG animatedProps={animatedImpellerProps}>
        <Circle r="4" fill="#00C2FF" />
        <Path
          d="M -12 0 L 12 0 M 0 -12 L 0 12 M -8 -8 L 8 8 M -8 8 L 8 -8"
          stroke="#00C2FF"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </AnimatedG>

      {/* Label & RPM Badge */}
      <SvgText
        x="0"
        y="30"
        fill="#E2E8F0"
        fontSize="8.5"
        fontWeight="bold"
        textAnchor="middle"
      >
        PUMP 01
      </SvgText>
      <SvgText
        x="0"
        y="40"
        fill={statusColor}
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        {status === 'running' ? `${rpm} RPM` : status.toUpperCase()}
      </SvgText>
    </G>
  );
};
