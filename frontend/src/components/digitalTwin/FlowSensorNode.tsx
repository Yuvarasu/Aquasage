import React, { useEffect, useState } from 'react';
import { G, Circle, Rect, Path, Text as SvgText } from 'react-native-svg';

export interface FlowSensorNodeProps {
  x: number;
  y: number;
  tag: string;
  valueText: string;
  unitText: string;
  color?: string;
  isAlert?: boolean;
}

export const FlowSensorNode: React.FC<FlowSensorNodeProps> = ({
  x,
  y,
  tag,
  valueText,
  unitText,
  color = '#38BDF8',
  isAlert = false,
}) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let animId: number;
    let start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      setRotation((elapsed / 3.2) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const activeColor = isAlert ? '#EF4444' : color;

  return (
    <G transform={[{ translateX: x }, { translateY: y }]}>
      {/* Black inline YF-S201 body (clamped over pipe) */}
      <Rect x="-15" y="-12" width="30" height="24" rx="3" fill="#050A14" stroke="#1E293B" strokeWidth="1.4" />
      {/* Side collars */}
      <Rect x="-19" y="-7" width="4" height="14" rx="1" fill="#0B1220" stroke="#334155" strokeWidth="0.8" />
      <Rect x="15" y="-7" width="4" height="14" rx="1" fill="#0B1220" stroke="#334155" strokeWidth="0.8" />

      {/* Small rotor window */}
      <Circle cx="0" cy="0" r="5.5" fill="#030812" stroke={activeColor} strokeWidth="0.9" />
      <G rotation={rotation} origin="0, 0">
        <Path d="M -3.5 0 L 3.5 0 M 0 -3.5 L 0 3.5" stroke={activeColor} strokeWidth="1.2" strokeLinecap="round" />
      </G>
      <Circle r="1.2" fill={activeColor} />

      {/* Status LED */}
      <Circle cx="10" cy="-8" r="1.6" fill={activeColor} />

      {/* Tag pill above */}
      <Rect x="-16" y="-30" width="32" height="12" rx="6" fill="#0F172A" stroke={activeColor} strokeWidth="1" />
      <SvgText x="0" y="-21" fill={activeColor} fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
        {tag}
      </SvgText>

      {/* Readout below */}
      <SvgText x="0" y="26" fill="#FFFFFF" fontSize="8.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">
        {valueText}
      </SvgText>
      <SvgText x="0" y="34" fill="#94A3B8" fontSize="6" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
        {unitText}
      </SvgText>
    </G>
  );
};