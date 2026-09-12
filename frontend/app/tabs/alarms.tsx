import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  CheckCheck,
  Filter,
} from 'lucide-react-native';
import { ApiService } from '../../src/services/apiService';
import { useAlertStore } from '../../src/store/useAlertStore';
import { SCADAAlarm, AlarmSeverity } from '../../src/types/telemetry';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { hapticsService } from '../../src/services/hapticsService';

type FilterOption = 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO';

export default function AlarmsScreen() {
  const { alarms, acknowledgeAlarm } = useAlertStore();
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadBackendAlarms = async () => {
    setLoading(true);
    const fetched = await ApiService.fetchAlarms();
    if (fetched && fetched.length > 0) {
      // Merge with store if needed
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadBackendAlarms();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadBackendAlarms();
  };

  const handleAcknowledge = async (id: string) => {
    hapticsService.tapMedium();
    acknowledgeAlarm(id);
    await ApiService.acknowledgeAlarm(id);
  };

  const handleAcknowledgeAll = async () => {
    hapticsService.success();
    const unack = alarms.filter((a) => !a.acknowledged);
    for (const a of unack) {
      acknowledgeAlarm(a.id);
      ApiService.acknowledgeAlarm(a.id);
    }
  };

  const filteredAlarms = alarms.filter((alarm) => {
    if (filter === 'ALL') return true;
    return alarm.severity.toUpperCase() === filter;
  });

  const unackCount = alarms.filter((a) => !a.acknowledged).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ALARMS</Text>
          <Text style={styles.headerSub}>
            Real-Time Alert Notifications • {unackCount} Active
          </Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.iconBtn} activeOpacity={0.7}>
          <RefreshCw size={16} color="#00C2FF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00C2FF"
            colors={['#00C2FF']}
          />
        }
      >
        {/* --- FILTER & BULK ACTION BAR --- */}
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as FilterOption[]).map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  hapticsService.tapLight();
                  setFilter(opt);
                }}
                style={[styles.filterChip, filter === opt && styles.filterChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, filter === opt && styles.filterChipTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {unackCount > 0 && (
            <TouchableOpacity
              onPress={handleAcknowledgeAll}
              style={styles.ackAllBtn}
              activeOpacity={0.7}
            >
              <CheckCheck size={13} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.ackAllText}>ACK ALL</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- ALARM LIST --- */}
        {loading ? (
          <ActivityIndicator color="#00C2FF" style={{ marginTop: 24 }} />
        ) : filteredAlarms.length === 0 ? (
          <GlassCard variant="emerald" style={{ alignItems: 'center', marginVertical: 20 }} padding={24}>
            <CheckCircle2 size={32} color="#10B981" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>All Systems Nominal</Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
              No active {filter !== 'ALL' ? filter : ''} alarms registered.
            </Text>
          </GlassCard>
        ) : (
          filteredAlarms.map((alarm) => {
            const isCritical = alarm.severity === 'critical';
            const isWarning = alarm.severity === 'warning';
            const cardVariant = isCritical ? 'red' : isWarning ? 'amber' : 'cyan';

            return (
              <GlassCard
                key={alarm.id}
                variant={cardVariant}
                style={{ marginBottom: 12 }}
                padding={14}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <View style={[styles.alarmIconBox, { backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                      {isCritical ? <ShieldAlert size={16} color="#EF4444" /> : <AlertTriangle size={16} color="#F59E0B" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>{alarm.title}</Text>
                      <Text style={{ color: '#64748B', fontSize: 9, fontFamily: 'monospace', marginTop: 1 }}>
                        Origin: {alarm.sourceNode}
                      </Text>
                    </View>
                  </View>

                  <StatusBadge
                    status={isCritical ? 'critical' : isWarning ? 'warning' : 'idle'}
                    label={alarm.severity.toUpperCase()}
                    size="sm"
                  />
                </View>

                <Text style={styles.alarmMessage}>{alarm.message}</Text>

                <View style={styles.alarmFooter}>
                  <Text style={styles.timestampText}>{alarm.timestamp}</Text>

                  {alarm.acknowledged ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <CheckCircle2 size={13} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={styles.ackLabel}>RESOLVED</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleAcknowledge(alarm.id)}
                      style={styles.ackBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.ackBtnText}>ACKNOWLEDGE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#071426',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 2,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0D1B2E',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    backgroundColor: '#091524',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 194, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.3)',
  },
  filterChipText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: 'bold',
  },
  filterChipTextActive: {
    color: '#00C2FF',
  },
  ackAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ackAllText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  alarmIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  alarmMessage: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  alarmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.6)',
  },
  timestampText: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  ackLabel: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  ackBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ackBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
});