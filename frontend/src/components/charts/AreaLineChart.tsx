import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle, Text as SvgText } from 'react-native-svg';

export interface DataPoint {
  label: string;
  value: number;
}

export interface AreaLineChartProps {
  data: DataPoint[];
  height?: number;
  lineColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  unit?: string;
  showPoints?: boolean;
}

export const AreaLineChart: React.FC<AreaLineChartProps> = ({
  data,
  height = 160,
  lineColor = '#00C2FF',
  gradientFrom = 'rgba(0, 194, 255, 0.4)',
  gradientTo = 'rgba(0, 194, 255, 0.0)',
  unit = '',
  showPoints = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No telemetry trend data available</Text>
      </View>
    );
  }

  const chartWidth = 330;
  const paddingX = 24;
  const paddingTop = 20;
  const paddingBottom = 26;
  const availableWidth = chartWidth - paddingX * 2;
  const availableHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * availableWidth;
    const y = paddingTop + availableHeight - ((d.value - minVal) / range) * availableHeight;
    return { x, y, value: d.value, label: d.label };
  });

  // Generate smooth SVG cubic spline path
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i != pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = generateSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + availableHeight} L ${points[0].x} ${paddingTop + availableHeight} Z`;

  // Find Peak and Trough
  let maxPoint = points[0];
  for (const pt of points) {
    if (pt.value > maxPoint.value) maxPoint = pt;
  }

  const gradId = `areaGrad_${lineColor.replace('#', '')}`;

  return (
    <View style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={gradientFrom} />
            <Stop offset="100%" stopColor={gradientTo} />
          </LinearGradient>
        </Defs>

        {/* Horizontal Background Grid Guides */}
        {[0, 0.5, 1].map((pct, idx) => {
          const y = paddingTop + availableHeight * (1 - pct);
          const gridVal = (minVal + range * pct).toFixed(range > 10 ? 0 : 1);
          return (
            <React.Fragment key={idx}>
              <Line
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#1E293B"
                strokeWidth="1"
                strokeDasharray={[4, 4]}
              />
              <SvgText
                x={paddingX - 4}
                y={y + 3}
                fill="#475569"
                fontSize="7.5"
                fontFamily="monospace"
                textAnchor="end"
              >
                {gridVal}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Filled Gradient Area */}
        <Path d={areaPath} fill={`url(#${gradId})`} />

        {/* Top Smooth Line */}
        <Path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Data Points */}
        {showPoints &&
          points.map((pt, idx) => (
            <Circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={pt === maxPoint ? "4" : "2.5"}
              fill={pt === maxPoint ? "#FFFFFF" : lineColor}
              stroke="#071426"
              strokeWidth="1.5"
            />
          ))}

        {/* Peak Indicator Badge */}
        <Circle
          cx={maxPoint.x}
          cy={maxPoint.y}
          r="6"
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeDasharray={[2, 2]}
        />

        {/* X-Axis Tick Labels */}
        {points.map((pt, idx) => {
          // Show label if reasonable spacing
          if (data.length > 7 && idx % 2 !== 0 && idx !== points.length - 1) return null;
          return (
            <SvgText
              key={idx}
              x={pt.x}
              y={height - 8}
              fill="#64748B"
              fontSize="7.5"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {pt.label}
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
