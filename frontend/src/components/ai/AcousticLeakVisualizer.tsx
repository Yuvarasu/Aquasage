import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Line, Text as SvgText } from 'react-native-svg';
import { AlertTriangle, ShieldCheck, MapPin, Wrench } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { StatusBadge } from '../ui/StatusBadge';

export interface AcousticLeakVisualizerProps {
  leakProbability: number; // 0.0 to 1.0
  estimatedDistanceKm?: number; // e.g. 2.8 km from source
  totalPipelineLengthKm?: number; // default 5.2 km
  flowLossLmin?: number;
}

export const AcousticLeakVisualizer: React.FC<AcousticLeakVisualizerProps> = ({
  leakProbability,
  estimatedDistanceKm = 2.4,
  totalPipelineLengthKm = 5.2,
  flowLossLmin = 14.8,
}) => {
  const isHighRisk = leakProbability > 0.4;
  const chartWidth = 320;
  const chartHeight = 80;
  const paddingX = 24;
  const availableWidth = chartWidth - paddingX * 2;

  const leakRatio = Math.min(1, Math.max(0, estimatedDistanceKm / totalPipelineLengthKm));
  const pinX = paddingX + leakRatio * availableWidth;

  const nodes = [
    { label: 'NODE 01 (0.0 km)', x: paddingX },
    { label: 'NODE 02 (2.6 km)', x: paddingX + availableWidth * 0.5 },
    { label: 'TANK (5.2 km)', x: paddingX + availableWidth },
  ];

  return (
    <GlassCard variant={isHighRisk ? 'red' : 'cyan'} style={{ marginBottom: 14 }} padding={16}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconBox, { backgroundColor: isHighRisk ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 194, 255, 0.15)' }]}>
            {isHighRisk ? <AlertTriangle size={18} color="#EF4444" /> : <ShieldCheck size={18} color="#00C2FF" />}
          </View>
          <View>
            <Text style={styles.title}>Acoustic Wave Localization Radar</Text>
            <Text style={styles.subtitle}>Cross-Correlation Sensor Array • Dual-Transducer</Text>
          </View>
        </View>

        <StatusBadge
          status={isHighRisk ? 'critical' : 'online'}
          label={isHighRisk ? 'LEAK PINPOINTED' : 'STRUCTURAL OK'}
          size="sm"
        />
      </View>

      {/* SVG Pipeline Distance Map */}
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Main Pipeline Track */}
          <Line
            x1={paddingX}
            y1="34"
            x2={chartWidth - paddingX}
            y2="34"
            stroke="#1E293B"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Sensor Nodes on Track */}
          {nodes.map((n, idx) => (
            <React.Fragment key={idx}>
              <Circle cx={n.x} cy="34" r="6" fill="#0D1B2E" stroke="#00C2FF" strokeWidth="2" />
              <Circle cx={n.x} cy="34" r="2.5" fill="#00C2FF" />
            </React.Fragment>
          ))}

          {/* Anomaly Location Pin */}
          {isHighRisk ? (
            <React.Fragment>
              {/* Pulsing Acoustic Glow Ring */}
              <Circle
                cx={pinX}
                cy="34"
                r="14"
                fill="rgba(239, 68, 68, 0.2)"
                stroke="#EF4444"
                strokeWidth="1.5"
                strokeDasharray={[2, 2]}
              />
              <Circle cx={pinX} cy="34" r="5" fill="#EF4444" />
              {/* Pin Callout Box */}
              <Rect
                x={pinX - 35}
                y="2"
                width="70"
                height="16"
                rx="4"
                fill="#DC2626"
              />
              <SvgText
                x={pinX}
                y="13"
                fill="#FFFFFF"
                fontSize="7.5"
                fontWeight="900"
                fontFamily="monospace"
                textAnchor="middle"
              >
                KM {estimatedDistanceKm.toFixed(1)} (±20m)
              </SvgText>
            </React.Fragment>
          ) : (
            <SvgText
              x={chartWidth / 2}
              y="16"
              fill="#10B981"
              fontSize="8"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              ACOUSTIC SIGNAL NOMINAL • NO LEAK SIGNATURES
            </SvgText>
          )}

          {/* Distance Ticks */}
          {nodes.map((n, idx) => (
            <SvgText
              key={idx}
              x={n.x}
              y="58"
              fill="#64748B"
              fontSize="7"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {n.label}
            </SvgText>
          ))}
        </Svg>
      </View>

      {/* Anomaly Diagnostic Details */}
      {isHighRisk ? (
        <View style={styles.anomalyBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={styles.boxLabel}>ESTIMATED LOSS RATE</Text>
            <Text style={styles.lossVal}>~{flowLossLmin.toFixed(1)} L/min</Text>
          </View>
          <Text style={styles.remedyText}>
            Recommended Action: Dispatch Sector Alpha maintenance crew to Joint Section B-14 at KM {estimatedDistanceKm.toFixed(1)}.
          </Text>
        </View>
      ) : (
        <Text style={styles.safeSubtext}>
          Dual-transducer acoustic delay analysis indicates laminar pressure wave transmission with 0.08% variance.
        </Text>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
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
  anomalyBox: {
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  boxLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lossVal: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  remedyText: {
    color: '#CBD5E1',
    fontSize: 10,
    lineHeight: 14,
  },
  safeSubtext: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
});
