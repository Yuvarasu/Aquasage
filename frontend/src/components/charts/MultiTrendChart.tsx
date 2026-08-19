import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Line, Circle, Rect, Text as SvgText } from 'react-native-svg';

export interface QualityDataPoint {
  timestamp: string;
  tds_ppm: number;
  ph_level: number;
  turbidity_ntu: number;
  quality_score?: number;
}

export interface MultiTrendChartProps {
  data: QualityDataPoint[];
  height?: number;
}

export const MultiTrendChart: React.FC<MultiTrendChartProps> = ({
  data,
  height = 180,
}) => {
  const [activeSeries, setActiveSeries] = useState<{ ph: boolean; tds: boolean; turbidity: boolean }>({
    ph: true,
    tds: true,
    turbidity: true,
  });

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No water quality trend logs</Text>
      </View>
    );
  }

  const chartWidth = 330;
  const paddingX = 28;
  const paddingTop = 16;
  const paddingBottom = 26;
  const availableWidth = chartWidth - paddingX * 2;
  const availableHeight = height - paddingTop - paddingBottom;

  // Normalization boundaries
  // pH: 5.0 to 10.0 (safe zone 6.5 - 8.5)
  // TDS: 0 to 500 ppm
  // Turbidity: 0 to 5.0 NTU
  const normalize = (val: number, min: number, max: number) => {
    return Math.max(0, Math.min(1, (val - min) / (max - min)));
  };

  const getPointsForSeries = (getter: (d: QualityDataPoint) => number, min: number, max: number) => {
    return data.map((d, index) => {
      const norm = normalize(getter(d), min, max);
      const x = paddingX + (index / (data.length - 1 || 1)) * availableWidth;
      const y = paddingTop + availableHeight * (1 - norm);
      return { x, y, raw: getter(d), label: d.timestamp };
    });
  };

  const phPoints = getPointsForSeries((d) => d.ph_level, 5.0, 10.0);
  const tdsPoints = getPointsForSeries((d) => d.tds_ppm, 0, 500);
  const turbPoints = getPointsForSeries((d) => d.turbidity_ntu, 0, 5.0);

  const makePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  };

  // Safe pH band (6.5 to 8.5)
  const safePhTop = paddingTop + availableHeight * (1 - normalize(8.5, 5.0, 10.0));
  const safePhBottom = paddingTop + availableHeight * (1 - normalize(6.5, 5.0, 10.0));
  const safePhHeight = safePhBottom - safePhTop;

  return (
    <View style={styles.container}>
      {/* Legend & Series Toggle Controls */}
      <View style={styles.legendRow}>
        <TouchableOpacity
          onPress={() => setActiveSeries((s) => ({ ...s, ph: !s.ph }))}
          style={[styles.legendPill, activeSeries.ph && { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
        >
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, activeSeries.ph && { color: '#10B981' }]}>pH Level</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSeries((s) => ({ ...s, tds: !s.tds }))}
          style={[styles.legendPill, activeSeries.tds && { borderColor: '#00C2FF', backgroundColor: 'rgba(0, 194, 255, 0.15)' }]}
        >
          <View style={[styles.legendDot, { backgroundColor: '#00C2FF' }]} />
          <Text style={[styles.legendText, activeSeries.tds && { color: '#00C2FF' }]}>TDS (ppm)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSeries((s) => ({ ...s, turbidity: !s.turbidity }))}
          style={[styles.legendPill, activeSeries.turbidity && { borderColor: '#A855F7', backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}
        >
          <View style={[styles.legendDot, { backgroundColor: '#A855F7' }]} />
          <Text style={[styles.legendText, activeSeries.turbidity && { color: '#A855F7' }]}>Turbidity (NTU)</Text>
        </TouchableOpacity>
      </View>

      {/* SVG Canvas */}
      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        {/* Safe pH Envelope Zone */}
        <Rect
          x={paddingX}
          y={safePhTop}
          width={availableWidth}
          height={safePhHeight}
          fill="rgba(16, 185, 129, 0.06)"
          stroke="rgba(16, 185, 129, 0.2)"
          strokeWidth="1"
          strokeDasharray={[3, 3]}
        />
        <SvgText
          x={chartWidth - paddingX - 4}
          y={safePhTop + 10}
          fill="#10B981"
          fontSize="6.5"
          fontFamily="monospace"
          textAnchor="end"
        >
          SAFE pH ZONE (6.5 - 8.5)
        </SvgText>

        {/* Horizontal Baseline Guides */}
        {[0, 0.5, 1].map((pct, idx) => {
          const y = paddingTop + availableHeight * (1 - pct);
          return (
            <Line
              key={idx}
              x1={paddingX}
              y1={y}
              x2={chartWidth - paddingX}
              y2={y}
              stroke="#1E293B"
              strokeWidth="1"
              strokeDasharray={[2, 2]}
            />
          );
        })}

        {/* TDS Series (Cyan) */}
        {activeSeries.tds && (
          <Path
            d={makePath(tdsPoints)}
            fill="none"
            stroke="#00C2FF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}

        {/* Turbidity Series (Purple) */}
        {activeSeries.turbidity && (
          <Path
            d={makePath(turbPoints)}
            fill="none"
            stroke="#A855F7"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}

        {/* pH Series (Emerald) */}
        {activeSeries.ph && (
          <Path
            d={makePath(phPoints)}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* X-Axis Time Ticks */}
        {data.map((d, idx) => {
          if (idx % Math.ceil(data.length / 5) !== 0 && idx !== data.length - 1) return null;
          const x = paddingX + (idx / (data.length - 1 || 1)) * availableWidth;
          return (
            <SvgText
              key={idx}
              x={x}
              y={height - 6}
              fill="#64748B"
              fontSize="7"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {d.timestamp}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#091524',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#091524',
    borderRadius: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
  },
});
