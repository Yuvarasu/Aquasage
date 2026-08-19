import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { History, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useActuatorStore } from '../../store/useActuatorStore';
import { GlassCard } from '../ui/GlassCard';

export const AuditLogSheet: React.FC = () => {
  const { auditLogs } = useActuatorStore();

  return (
    <GlassCard variant="slate" padding={14}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <History size={16} color="#00C2FF" style={{ marginRight: 6 }} />
          <Text style={styles.title}>SCADA Actuator Command Audit Trail</Text>
        </View>
        <Text style={styles.countText}>{auditLogs.length} EVENTS</Text>
      </View>

      {auditLogs.length === 0 ? (
        <Text style={styles.emptyText}>No recent teleoperation commands dispatched</Text>
      ) : (
        auditLogs.slice(0, 6).map((log) => (
          <View key={log.id} style={styles.logItem}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <CheckCircle2 size={12} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.nodeTag}>{log.targetNode}</Text>
                <Text style={styles.commandText} numberOfLines={1}>
                  {log.command}
                </Text>
              </View>
              <Text style={styles.timeText}>{log.timestamp}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
              <Text style={styles.paramText}>Param: {log.parameter || 'N/A'}</Text>
              <Text style={styles.operatorText}>{log.operator}</Text>
            </View>
          </View>
        ))
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 'bold',
  },
  countText: {
    color: '#64748B',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 11,
    paddingVertical: 8,
  },
  logItem: {
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  nodeTag: {
    color: '#00C2FF',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginRight: 6,
  },
  commandText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
  },
  timeText: {
    color: '#64748B',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  paramText: {
    color: '#94A3B8',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  operatorText: {
    color: '#64748B',
    fontSize: 9,
  },
});
