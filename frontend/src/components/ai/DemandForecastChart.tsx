import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle, Text as SvgText } from 'react-native-svg';
import { TrendingUp, Sparkles } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';

export interface ForecastPoint {
  hour_offset: number;
  timestamp: string;
  projected_consumption_liters: number;
  confidence_lower: number;
  confidence_upper: number;
}

export interface DemandForecastChartProps {
  forecastPoints?: ForecastPoint[];
  totalProjectedLiters?: number;
}

export const DemandForecastChart: React.FC<DemandForecastChartProps> = ({
  forecastPoints,
  totalProjectedLiters = 21450,
}) => {
  const defaultPoints: ForecastPoint[] = [
    { hour_offset: 0, timestamp: '+0h', projected_consumption_liters: 650, confidence_lower: 580, confidence_upper: 720 },
    { hour_offset: 4, timestamp: '+4h', projected_consumption_liters: 420, confidence_lower: 350, confidence_upper: 490 },
    { hour_offset: 8, timestamp: '+8h', projected_consumption_liters: 1450, confidence_lower: 1280, confidence_upper: 1620 },
    { hour_offset: 12, timestamp: '+12h', projected_consumption_liters: 980, confidence_lower: 860, confidence_upper: 1100 },
    { hour_offset: 16, timestamp: '+16h', projected_consumption_liters: 1120, confidence_lower: 980, confidence_upper: 1260 },
    { hour_offset: 20, timestamp: '+20h', projected_consumption_liters: 1580, confidence_lower: 1390, confidence_upper: 1770 },
    { hour_offset: 24, timestamp: '+24h', projected_consumption_liters: 720, confidence_lower: 610, confidence_upper: 830 },
  ];

  const points = forecastPoints && forecastPoints.length > 0 ? forecastPoints : defaultPoints;

  const chartWidth = 320;
  const chartHeight = 150;
  const paddingX = 24;
  const paddingTop = 16;
  const paddingBottom = 24;
  const availableWidth = chartWidth - paddingX * 2;
  const availableHeight = chartHeight - paddingTop - paddingBottom;

  const allVals = points.flatMap((p) => [p.confidence_lower, p.confidence_upper, p.projected_consumption_liters]);
  const minVal = Math.min(...allVals, 0);
  const maxVal = Math.max(...allVals, 1000);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const getCoord = (val: number, idx: number) => {
    const x = paddingX + (idx / (points.length - 1 || 1)) * availableWidth;
    const y = paddingTop + availableHeight - ((val - minVal) / range) * availableHeight;
    return { x, y };
  };

  const centerCoords = points.map((p, i) => getCoord(p.projected_consumption_liters, i));
  const upperCoords = points.map((p, i) => getCoord(p.confidence_upper, i));
  const lowerCoords = points.map((p, i) => getCoord(p.confidence_lower, i));

  const makePath = (pts: { x: number; y: number }[]) => {
    return pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  };

  // Envelope polygon: upper line from left-to-right, then lower line right-to-left
  const upperPath = makePath(upperCoords);
  const lowerReversed = [...lowerCoords].reverse();
  const envelopePath = `${upperPath} L ${lowerReversed.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`;
  const centerPath = makePath(centerCoords);

  return (
    <GlassCard variant="cyan" style={{ marginBottom: 14 }} padding={16}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.iconBox}>
            <Sparkles size={18} color="#00C2FF" />
          </View>
          <View>
            <Text style={styles.title}>24-Hour AI Demand Forecast</Text>
            <Text style={styles.subtitle}>LSTM Recurrent Neural Network • 95% Confidence Band</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalProjectedLiters.toLocaleString()} L</Text>
        </View>
      </View>

      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Defs>
          <LinearGradient id="envelopeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#00C2FF" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#00C2FF" stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Horizontal Guides */}
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
              strokeDasharray={[3, 3]}
            />
          );
        })}

        {/* Confidence Interval Envelope */}
        <Path d={envelopePath} fill="url(#envelopeGrad)" stroke="rgba(0, 194, 255, 0.3)" strokeWidth="1" strokeDasharray={[2, 2]} />

        {/* Center Projected Line */}
        <Path d={centerPath} fill="none" stroke="#00C2FF" strokeWidth="2.5" strokeLinecap="round" />

        {/* Center Points */}
        {centerCoords.map((pt, idx) => (
          <Circle key={idx} cx={pt.x} cy={pt.y} r="3" fill="#00C2FF" stroke="#071426" strokeWidth="1.5" />
        ))}

        {/* X-Axis Ticks */}
        {points.map((p, idx) => {
          const pt = centerCoords[idx];
          return (
            <SvgText
              key={idx}
              x={pt.x}
              y={chartHeight - 6}
              fill="#64748B"
              fontSize="7.5"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {p.timestamp}
            </SvgText>
          );
        })}
      </Svg>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 194, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  badge: {
    backgroundColor: 'rgba(0, 194, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: '#00C2FF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
