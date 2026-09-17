import React, { useEffect } from 'react';
import { G, Circle, Path, Text as SvgText, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ThreeWayValveNodeProps {
  x: number;
  y: number;
  routeToFilter: boolean;
}

export const ThreeWayValveNode: React.FC<ThreeWayValveNodeProps> = ({
  x,
  y,
  routeToFilter,
}) => {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, []);

  const animatedProps = useAnimatedProps(() => ({ opacity: pulse.value }));
  const activeColor = routeToFilter ? '#F59E0B' : '#10B981';

  return (
    <G transform={[{ translateX: x }, { translateY: y }]}>
      {/* Valve body */}
      <Circle r="14" fill="#0D1B2E" stroke={activeColor} strokeWidth="2.2" />
      <Circle r="7" fill="#1E293B" stroke={activeColor} strokeWidth="1.2" />

      {/* Route arrow inside the valve */}
      {routeToFilter ? (
        <>
          <Path d="M 0 7 L 0 16" stroke={activeColor} strokeWidth="2.4" strokeLinecap="round" />
          <Path d="M -4 12 L 0 16 L 4 12" stroke={activeColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <Path d="M 7 0 L 16 0" stroke={activeColor} strokeWidth="2.4" strokeLinecap="round" />
          <Path d="M 12 -4 L 16 0 L 12 4" stroke={activeColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Center pivot with pulse */}
      <AnimatedCircle r="2.6" fill={activeColor} animatedProps={animatedProps} />

      {/* Tag pill above the pipe — safe, always above everything */}
      <Rect x="-16" y="-34" width="32" height="13" rx="6" fill="#0F172A" stroke={activeColor} strokeWidth="1" />
      <SvgText
        x="0"
        y="-24"
        fill={activeColor}
        fontSize="7"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        3-WAY
      </SvgText>
      {/* NOTE: No "TO VILLAGE" / "TO FILTER" text — the arrow shows direction.
          This removes the label that was overlapping the filtration canister. */}
    </G>
  );
};