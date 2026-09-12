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
  Cpu,
  Wifi,
  BatteryMedium,
  Signal,
  RefreshCw,
  Sliders,
  Radio,
  Layers,
  CheckCircle2,
} from 'lucide-react-native';
import { ApiService } from '../../src/services/apiService';
import { DeviceNode } from '../../src/types/telemetry';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { PumpVfdCard } from '../../src/components/teleoperation/PumpVfdCard';
import { SolenoidValveCard } from '../../src/components/teleoperation/SolenoidValveCard';
import { EmergencyStopButton } from '../../src/components/teleoperation/EmergencyStopButton';
import { AuditLogSheet } from '../../src/components/teleoperation/AuditLogSheet';

type DeviceTabMode = 'actuators' | 'sensors';

export default function DevicesScreen() {
  const [tabMode, setTabMode] = useState<DeviceTabMode>('actuators');
  const [devices, setDevices] = useState<DeviceNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDevices = async () => {
    setLoading(true);
    const data = await ApiService.fetchDevices();
    if (data && data.length > 0) {
      setDevices(data);
    } else {
      // Fallback registered node inventory
      setDevices([
        {
          id: '1',
          name: 'ESP32-Flow-Pressure-01',
          type: 'Sensor',
          protocol: 'WiFi',
          batteryLevel: 98,
          signalRSSI: -62,
          firmwareVersion: 'v2.4.1',
          isOnline: true,
        },
        {
          id: '2',
          name: 'LoRa-Village-Tank-Ultrasonic',
          type: 'Sensor',
          protocol: 'LoRaWAN',
          batteryLevel: 84,
          signalRSSI: -78,
          firmwareVersion: 'v1.8.0',
          isOnline: true,
        },
        {
          id: '3',
          name: 'Modbus-Pump-VFD-Actuator',
          type: 'Actuator',
          protocol: 'RS485/Modbus',
          batteryLevel: 100,
          signalRSSI: -45,
          firmwareVersion: 'v3.1.2',
          isOnline: true,
        },
      ]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>HARDWARE</Text>
          <Text style={styles.headerSub}>Teleoperation Actuators & Node Matrix</Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} activeOpacity={0.7}>
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
        {/* --- DECK MODE SELECTOR --- */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setTabMode('actuators')}
            style={[styles.tabButton, tabMode === 'actuators' && styles.tabButtonActive]}
            activeOpacity={0.7}
          >
            <Sliders size={13} color={tabMode === 'actuators' ? '#00C2FF' : '#64748B'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, tabMode === 'actuators' && styles.tabTextActive]}>
              ACTUATOR CONTROLS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTabMode('sensors')}
            style={[styles.tabButton, tabMode === 'sensors' && styles.tabButtonActive]}
            activeOpacity={0.7}
          >
            <Radio size={13} color={tabMode === 'sensors' ? '#00C2FF' : '#64748B'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, tabMode === 'sensors' && styles.tabTextActive]}>
              IoT SENSOR MATRIX
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- VIEW 1: ACTUATOR CONTROLS --- */}
        {tabMode === 'actuators' ? (
          <View>
            <EmergencyStopButton />
            <PumpVfdCard />
            <SolenoidValveCard />
            <AuditLogSheet />
          </View>
        ) : (
          /* --- VIEW 2: IOT SENSOR MATRIX --- */
          <View>
            {loading ? (
              <ActivityIndicator color="#00C2FF" style={{ marginTop: 20 }} />
            ) : (
              devices.map((device) => (
                <GlassCard
                  key={device.id}
                  variant={device.isOnline ? 'cyan' : 'slate'}
                  style={{ marginBottom: 12 }}
                  padding={14}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.iconBox, { backgroundColor: device.isOnline ? 'rgba(6, 182, 212, 0.15)' : 'rgba(100, 116, 139, 0.15)' }]}>
                        <Cpu size={16} color={device.isOnline ? '#00C2FF' : '#64748B'} />
                      </View>
                      <View>
                        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>{device.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 10, fontFamily: 'monospace' }}>
                          Type: {device.type} • {device.protocol}
                        </Text>
                      </View>
                    </View>

                    <StatusBadge
                      status={device.isOnline ? 'online' : 'offline'}
                      label={device.isOnline ? 'ONLINE' : 'OFFLINE'}
                      size="sm"
                    />
                  </View>

                  <View style={styles.deviceFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <BatteryMedium size={14} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={styles.footerVal}>{device.batteryLevel}%</Text>

                      <Signal size={14} color="#00C2FF" style={{ marginLeft: 12, marginRight: 4 }} />
                      <Text style={styles.footerVal}>{device.signalRSSI} dBm</Text>
                    </View>

                    <Text style={styles.fwText}>FW: {device.firmwareVersion}</Text>
                  </View>
                </GlassCard>
              ))
            )}
          </View>
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
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0D1B2E',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#091524',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  tabText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  tabTextActive: {
    color: '#00C2FF',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.6)',
  },
  footerVal: {
    color: '#CBD5E1',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  fwText: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});