import React, { useEffect } from 'react';
import { G, Circle, Rect, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface SensorGlowNodeProps {
  x: number;
  y: number;
  tag: string;
  valueText: string;
  unitText: string;
  color?: string;
  isAlert?: boolean;
}

export const SensorGlowNode: React.FC<SensorGlowNodeProps> = ({
  x,
  y,
  tag,
  valueText,
  unitText,
  color = '#00C2FF',
  isAlert = false,
}) => {
  const pulseRadius = useSharedValue(12);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseRadius.value = withRepeat(
      withTiming(22, { duration: isAlert ? 700 : 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: isAlert ? 700 : 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [isAlert]);

  const animatedPulseProps = useAnimatedProps(() => ({
    r: pulseRadius.value,
    opacity: pulseOpacity.value,
  }));

  const activeColor = isAlert ? '#EF4444' : color;

  return (
    <G transform={[{ translateX: x }, { translateY: y }]}>
      {/* Radar Wave Pulse */}
      <AnimatedCircle
        cx="0"
        cy="0"
        fill="none"
        stroke={activeColor}
        strokeWidth="1.5"
        animatedProps={animatedPulseProps}
      />

      {/* Sensor Core Housing */}
      <Circle
        cx="0"
        cy="0"
        r="11"
        fill="#0D1B2E"
        stroke={activeColor}
        strokeWidth="2"
      />
      <Circle
        cx="0"
        cy="0"
        r="4"
        fill={activeColor}
      />

      {/* Instrument Tag Badge */}
      <Rect
        x="-16"
        y="-28"
        width="32"
        height="12"
        rx="3"
        fill="#1E293B"
        stroke="#334155"
        strokeWidth="1"
      />
      <SvgText
        x="0"
        y="-19"
        fill="#CBD5E1"
        fontSize="7"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        {tag}
      </SvgText>

      {/* Live Measurement Readout */}
      <SvgText
        x="0"
        y="22"
        fill="#FFFFFF"
        fontSize="8.5"
        fontWeight="900"
        fontFamily="monospace"
        textAnchor="middle"
      >
        {valueText}
      </SvgText>
      <SvgText
        x="0"
        y="30"
        fill="#94A3B8"
        fontSize="6.5"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        {unitText}
      </SvgText>
    </G>
  );
};
