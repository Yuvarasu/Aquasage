import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wrench, Zap, Clock, ShieldCheck, Activity } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { StatusBadge } from '../ui/StatusBadge';

export interface RulDegradationGaugeProps {
  healthScore?: number; // 0 to 100
  estimatedRulHours?: number; // e.g. 3420
  rpm?: number;
}

export const RulDegradationGauge: React.FC<RulDegradationGaugeProps> = ({
  healthScore = 94,
  estimatedRulHours = 3420,
  rpm = 1450,
}) => {
  const isHealthy = healthScore > 80;
  const daysRemaining = Math.round(estimatedRulHours / 24);

  return (
    <GlassCard variant={isHealthy ? 'emerald' : 'amber'} style={{ marginBottom: 14 }} padding={16}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconBox, { backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
            <Wrench size={18} color={isHealthy ? '#10B981' : '#F59E0B'} />
          </View>
          <View>
            <Text style={styles.title}>Motor Prognostics & RUL</Text>
            <Text style={styles.subtitle}>Bearing Vibration Harmonics • Weibull Model</Text>
          </View>
        </View>

        <StatusBadge
          status={isHealthy ? 'running' : 'warning'}
          label={isHealthy ? 'OPTIMAL' : 'SERVICE SOON'}
          size="sm"
        />
      </View>

      {/* RUL Big Readout */}
      <View style={styles.heroRow}>
        <View>
          <Text style={styles.heroLabel}>REMAINING USEFUL LIFE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.heroValue}>{estimatedRulHours.toLocaleString()}</Text>
            <Text style={styles.heroUnit}>HOURS</Text>
          </View>
        </View>

        <View style={styles.daysBadge}>
          <Clock size={12} color="#10B981" style={{ marginRight: 4 }} />
          <Text style={styles.daysText}>~{daysRemaining} Days to Service</Text>
        </View>
      </View>

      {/* Degradation Track */}
      <View style={styles.progressContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={styles.barLabel}>BEARING INTEGRITY SCORE</Text>
          <Text style={[styles.barVal, { color: isHealthy ? '#10B981' : '#F59E0B' }]}>{healthScore}%</Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${healthScore}%`,
                backgroundColor: isHealthy ? '#10B981' : '#F59E0B',
              },
            ]}
          />
        </View>
      </View>

      {/* Sub-Parameters Grid */}
      <View style={styles.paramsGrid}>
        <View style={styles.paramCard}>
          <Text style={styles.paramLabel}>CAVITATION RISK</Text>
          <Text style={[styles.paramValue, { color: '#10B981' }]}>0.04 (LOW)</Text>
        </View>

        <View style={styles.paramCard}>
          <Text style={styles.paramLabel}>VIBRATION RMS</Text>
          <Text style={styles.paramValue}>1.42 mm/s</Text>
        </View>

        <View style={styles.paramCard}>
          <Text style={styles.paramLabel}>CURRENT RPM LOAD</Text>
          <Text style={styles.paramValue}>{rpm} RPM</Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  heroLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  heroUnit: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  progressContainer: {
    marginBottom: 12,
  },
  barLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: 'bold',
  },
  barVal: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  track: {
    width: '100%',
    height: 6,
    backgroundColor: '#091524',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  paramsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  paramCard: {
    flex: 1,
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 2,
  },
  paramLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  paramValue: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
