import React from 'react';
import { G, Rect, Text as SvgText, Circle } from 'react-native-svg';

export interface SensorProbeReading {
  tag: string;
  value: string;
  unit: string;
  alert?: boolean;
}

export interface SensorProbeNodeProps {
  x: number;
  y: number;
  accent: string;
  readings: SensorProbeReading[];
  verdict: 'GOOD' | 'CONTAMINATED';
}

export const SensorProbeNode: React.FC<SensorProbeNodeProps> = ({
  x,
  y,
  accent,
  readings,
  verdict,
}) => {
  const podW = 62;
  const podH = 52;
  const good = verdict === 'GOOD';
  const verdictColor = good ? '#10B981' : '#F59E0B';

  return (
    <G transform={[{ translateX: x }, { translateY: y }]}>
      {/* Probe stem top connector */}
      <Circle cx="0" cy="0" r="3" fill={accent} />

      {/* Pod body */}
      <Rect x={-podW / 2} y={4} width={podW} height={podH} rx="6" fill="#0B1220" stroke={accent} strokeWidth="1.5" />
      <Rect x={-podW / 2} y={4} width={podW} height={14} rx="6" fill={accent} opacity={0.18} />
      <SvgText x="0" y={14} fill={accent} fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
        SENSING UNIT
      </SvgText>

      {/* Reading rows */}
      {readings.map((r, i) => {
        const rowY = 30 + i * 9;
        const vColor = r.alert ? '#EF4444' : '#E2E8F0';
        return (
          <G key={i}>
            <SvgText x={-podW / 2 + 7} y={rowY} fill="#64748B" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
              {r.tag}
            </SvgText>
            <SvgText x={podW / 2 - 7} y={rowY} fill={vColor} fontSize="7" fontWeight="900" fontFamily="monospace" textAnchor="end">
              {r.value} {r.unit}
            </SvgText>
          </G>
        );
      })}

      {/* Verdict pill */}
      <Rect x={-26} y={podH + 10} width={52} height="14" rx="7" fill={verdictColor} opacity={0.18} stroke={verdictColor} strokeWidth="1" />
      <SvgText x="0" y={podH + 20} fill={verdictColor} fontSize="7" fontWeight="900" fontFamily="monospace" textAnchor="middle">
        {good ? 'GOOD' : 'CONTAMINATED'}
      </SvgText>
    </G>
  );
};