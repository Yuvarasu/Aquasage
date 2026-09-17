import React, { useEffect } from 'react';
import { G, Rect, Text as SvgText, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export interface FiltrationCanisterNodeProps {
  x: number;
  y: number;
  active: boolean;
}

export const FiltrationCanisterNode: React.FC<FiltrationCanisterNodeProps> = ({
  x,
  y,
  active,
}) => {
  const glow = useSharedValue(0.35);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(active ? 0.95 : 0.35, {
        duration: active ? 800 : 1700,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [active]);

  const animatedProps = useAnimatedProps(() => ({ opacity: glow.value }));
  const color = active ? '#F59E0B' : '#10B981';

  return (
    <G transform={[{ translateX: x }, { translateY: y }]}>
      <Defs>
        <LinearGradient id="canisterGradTwin" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0B1220" />
          <Stop offset="100%" stopColor="#1E293B" />
        </LinearGradient>
      </Defs>

      {/* Top cap */}
      <Rect x="-18" y="-26" width="36" height="6" rx="2" fill="#1E293B" stroke={color} strokeWidth="0.8" />

      {/* Body */}
      <AnimatedRect
        x="-16"
        y="-20"
        width="32"
        height="52"
        rx="5"
        fill="url(#canisterGradTwin)"
        stroke={color}
        strokeWidth="1.8"
        animatedProps={animatedProps}
      />

      {/* Top LED */}
      <Circle cx="0" cy="-16" r="2" fill={color} />

      {/* 3 media bands */}
      <Rect x="-12" y="-10" width="24" height="5" rx="1" fill={color} opacity="0.35" />
      <Rect x="-12" y="-1" width="24" height="5" rx="1" fill={color} opacity="0.55" />
      <Rect x="-12" y="8" width="24" height="5" rx="1" fill={color} opacity="0.75" />

      {/* Status pill INSIDE canister */}
      <Rect
        x="-14"
        y="16"
        width="28"
        height="7"
        rx="3.5"
        fill={color}
        opacity="0.22"
        stroke={color}
        strokeWidth="0.7"
      />
      <SvgText
        x="0"
        y="21.5"
        fill={color}
        fontSize="4.5"
        fontWeight="900"
        fontFamily="monospace"
        textAnchor="middle"
      >
        {active ? 'FILTERING' : 'STANDBY'}
      </SvgText>

      {/* FLT-01 tag — INSIDE the canister bottom (below status pill, above outlet) */}
      <SvgText
        x="0"
        y="28.5"
        fill="#64748B"
        fontSize="4.5"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        FLT-01
      </SvgText>

      {/* Bottom outlet */}
      <Rect x="-8" y="32" width="16" height="4" rx="1" fill="#1E293B" stroke={color} strokeWidth="0.8" />
    </G>
  );
};