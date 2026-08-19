import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { GlassCard } from './GlassCard';

export interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  iconColor?: string;
  variant?: 'cyan' | 'emerald' | 'amber' | 'red' | 'slate';
  statusText?: string;
  statusColor?: string;
  statusBg?: string;
  subtext?: string;
  progressPercent?: number;
  width?: string | number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  iconColor = '#00C2FF',
  variant = 'cyan',
  statusText,
  statusColor = '#10B981',
  statusBg = 'rgba(16, 185, 129, 0.15)',
  subtext,
  progressPercent,
  width = '48%',
  style,
}) => {
  return (
    <GlassCard
      variant={variant}
      style={[{ width: width as any, marginVertical: 6, justifyContent: 'space-between' }, style]}
      padding={14}
    >
      <View>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}1A` }]}>
            <Icon size={15} color={iconColor} />
          </View>
        </View>

        {/* Value + Unit */}
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>

        {/* Progress Bar (Optional) */}
        {progressPercent !== undefined && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                  backgroundColor: iconColor,
                },
              ]}
            />
          </View>
        )}

        {/* Status Tag / Subtext */}
        {statusText && (
          <View style={[styles.statusTag, { backgroundColor: statusBg, borderColor: `${statusColor}40` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        )}

        {subtext && <Text style={styles.subtext}>{subtext}</Text>}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 2,
  },
  value: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
  unit: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    marginVertical: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subtext: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
});
