import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';

export interface BarDataPoint {
  label: string;
  value: number;
  sublabel?: string;
}

export interface VolumeBarChartProps {
  data: BarDataPoint[];
  height?: number;
  barColor?: string;
  unit?: string;
}

export const VolumeBarChart: React.FC<VolumeBarChartProps> = ({
  data,
  height = 160,
  barColor = '#0284C7',
  unit = 'L',
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No volumetric data</Text>
      </View>
    );
  }

  const chartWidth = 330;
  const paddingX = 16;
  const paddingTop = 22;
  const paddingBottom = 26;
  const availableWidth = chartWidth - paddingX * 2;
  const availableHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 100);
  const avgVal = values.reduce((a, b) => a + b, 0) / values.length;

  const barWidth = Math.min(28, (availableWidth / data.length) * 0.65);
  const step = availableWidth / data.length;

  const avgY = paddingTop + availableHeight - (avgVal / maxVal) * availableHeight;

  return (
    <View style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        <Defs>
          <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor={barColor} />
          </LinearGradient>
        </Defs>

        {/* Average Threshold Line */}
        <Line
          x1={paddingX}
          y1={avgY}
          x2={chartWidth - paddingX}
          y2={avgY}
          stroke="#F59E0B"
          strokeWidth="1"
          strokeDasharray={[3, 3]}
        />
        <SvgText
          x={chartWidth - paddingX}
          y={avgY - 4}
          fill="#F59E0B"
          fontSize="7"
          fontFamily="monospace"
          textAnchor="end"
        >
          AVG {Math.round(avgVal).toLocaleString()} {unit}
        </SvgText>

        {/* Vertical Bars */}
        {data.map((item, idx) => {
          const barHeight = Math.max(4, (item.value / maxVal) * availableHeight);
          const x = paddingX + idx * step + (step - barWidth) / 2;
          const y = paddingTop + availableHeight - barHeight;

          return (
            <React.Fragment key={idx}>
              {/* Background Track */}
              <Rect
                x={x}
                y={paddingTop}
                width={barWidth}
                height={availableHeight}
                rx={barWidth / 2}
                fill="#0F172A"
              />

              {/* Data Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={barWidth / 2}
                fill="url(#barGradient)"
              />

              {/* Bar Value Header */}
              <SvgText
                x={x + barWidth / 2}
                y={y - 4}
                fill="#CBD5E1"
                fontSize="6.5"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
              </SvgText>

              {/* X-Axis Date Label */}
              <SvgText
                x={x + barWidth / 2}
                y={height - 8}
                fill="#64748B"
                fontSize="7.5"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            </React.Fragment>
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
    justifyContent: 'center',
    marginVertical: 4,
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
