import React from 'react';
import { G, Rect, Text as SvgText, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface FluidTankNodeProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  levelPercent: number; // 0 to 100
  capacityLiters?: number;
}

export const FluidTankNode: React.FC<FluidTankNodeProps> = ({
  x,
  y,
  width = 46,
  height = 76,
  levelPercent,
  capacityLiters = 50000,
}) => {
  const safePercent = Math.min(100, Math.max(0, levelPercent));
  const innerMargin = 3;
  const maxFillHeight = height - innerMargin * 2;
  const currentFillHeight = (safePercent / 100) * maxFillHeight;
  const fillY = y + height - innerMargin - currentFillHeight;
  const currentVolume = Math.round((safePercent / 100) * capacityLiters);

  const getWaterColorGradient = () => {
    if (safePercent < 20) return ['#EF4444', '#7F1D1D']; // Low alert
    if (safePercent > 90) return ['#38BDF8', '#1D4ED8']; // Full
    return ['#06B6D4', '#1E40AF']; // Normal optimal
  };

  const [topColor, bottomColor] = getWaterColorGradient();

  return (
    <G>
      <Defs>
        <LinearGradient id="tankFluidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={topColor} stopOpacity="0.9" />
          <Stop offset="100%" stopColor={bottomColor} stopOpacity="0.95" />
        </LinearGradient>
      </Defs>

      {/* Support Legs / Staging Frame */}
      <Path
        d={`M ${x + 6} ${y + height} L ${x + 2} ${y + height + 20} M ${x + width - 6} ${y + height} L ${x + width - 2} ${y + height + 20} M ${x + 4} ${y + height + 10} L ${x + width - 4} ${y + height + 10}`}
        stroke="#334155"
        strokeWidth="2"
      />

      {/* Outer Tank Structure */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="6"
        fill="#0D1B2E"
        stroke="#334155"
        strokeWidth="2"
      />

      {/* Tank Roof Dome */}
      <Path
        d={`M ${x} ${y + 4} Q ${x + width / 2} ${y - 8} ${x + width} ${y + 4}`}
        fill="#1E293B"
        stroke="#334155"
        strokeWidth="1.5"
      />

      {/* Liquid Fill */}
      {currentFillHeight > 0 && (
        <Rect
          x={x + innerMargin}
          y={fillY}
          width={width - innerMargin * 2}
          height={currentFillHeight}
          rx="3"
          fill="url(#tankFluidGrad)"
        />
      )}

      {/* Tank Level Percentage Display */}
      <SvgText
        x={x + width / 2}
        y={y + height / 2 + 4}
        fill="#FFFFFF"
        fontSize="11"
        fontWeight="900"
        fontFamily="monospace"
        textAnchor="middle"
      >
        {safePercent.toFixed(0)}%
      </SvgText>

      {/* Capacity Subtext */}
      <SvgText
        x={x + width / 2}
        y={y + height + 32}
        fill="#94A3B8"
        fontSize="8"
        fontWeight="bold"
        textAnchor="middle"
      >
        VILLAGE TANK
      </SvgText>

      <SvgText
        x={x + width / 2}
        y={y + height + 42}
        fill="#38BDF8"
        fontSize="7"
        fontFamily="monospace"
        textAnchor="middle"
      >
        {currentVolume.toLocaleString()}L
      </SvgText>
    </G>
  );
};
