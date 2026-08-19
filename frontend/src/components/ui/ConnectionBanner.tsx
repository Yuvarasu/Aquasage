import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, RefreshCw, Activity } from 'lucide-react-native';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { socketService } from '../../services/socketService';
import { StatusBadge } from './StatusBadge';

export const ConnectionBanner: React.FC = () => {
  const { connectionState, latencyMs, isSimulating, streamSource } = useTelemetryStore();
  const { serverHost, serverPort } = useSettingsStore();

  const handleReconnect = () => {
    socketService.reconnect();
  };

  const getStatusVariant = () => {
    if (connectionState === 'connected') return 'online';
    if (connectionState === 'reconnecting' || connectionState === 'connecting') return 'warning';
    if (isSimulating) return 'idle';
    return 'offline';
  };

  const getStatusLabel = () => {
    if (connectionState === 'connected') return 'LIVE WS';
    if (connectionState === 'reconnecting') return 'RECONNECTING';
    if (connectionState === 'connecting') return 'CONNECTING';
    if (isSimulating) return 'SIMULATOR';
    return 'OFFLINE';
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <StatusBadge
          status={getStatusVariant()}
          label={getStatusLabel()}
          size="sm"
        />
        <Text style={styles.hostText}>
          {serverHost}:{serverPort}
        </Text>
      </View>

      <View style={styles.rightSection}>
        {connectionState === 'connected' ? (
          <View style={styles.latencyContainer}>
            <Activity size={12} color="#00C2FF" style={{ marginRight: 4 }} />
            <Text style={styles.latencyText}>{latencyMs > 0 ? `${latencyMs}ms` : '<10ms'}</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleReconnect}
            style={styles.reconnectButton}
            activeOpacity={0.7}
          >
            <RefreshCw size={11} color="#38BDF8" style={{ marginRight: 4 }} />
            <Text style={styles.reconnectText}>RECONNECT</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostText: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
    marginLeft: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  latencyText: {
    color: '#00C2FF',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  reconnectText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
