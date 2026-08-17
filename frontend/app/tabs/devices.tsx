import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Cpu, Wifi, BatteryMedium, Signal, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { ApiService } from '../../src/services/apiService';
import { DeviceNode } from '../../src/types/telemetry';

export default function DevicesScreen() {
  const [devices, setDevices] = useState<DeviceNode[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDevices = async () => {
    setLoading(true);
    const data = await ApiService.fetchDevices();
    if (data && data.length > 0) {
      setDevices(data);
    } else {
      // Fallback display if DB is freshly created
      setDevices([
        {
          id: '1',
          name: 'ESP32-Flow-Pressure-01',
          type: 'Sensor',
          protocol: 'WiFi',
          batteryLevel: 100,
          signalRSSI: -65,
          firmwareVersion: 'v2.4.1',
          isOnline: true,
        },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#071426', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 2 }}>IoT DEVICE MATRIX</Text>
          <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
            Sensor Nodes & Gateway Telemetry
          </Text>
        </View>

        <TouchableOpacity onPress={loadDevices} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#10233A', borderWidth: 1, borderColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={16} color="#00C2FF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color="#00C2FF" style={{ marginTop: 20 }} />
        ) : (
          devices.map((device) => (
            <View
              key={device.id}
              style={{
                backgroundColor: '#10233A',
                borderWidth: 1,
                borderColor: device.isOnline ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.3)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(6, 182, 212, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Cpu size={16} color="#00C2FF" />
                  </View>
                  <View>
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>{device.name}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}>
                      Protocol: {device.protocol} • Firmware: {device.firmwareVersion}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: device.isOnline ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                  <Text style={{ color: device.isOnline ? '#4ADE80' : '#EF4444', fontSize: 9, fontWeight: 'bold' }}>
                    {device.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(30, 41, 59, 0.6)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <BatteryMedium size={14} color="#4ADE80" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#CBD5E1', fontSize: 11, fontFamily: 'monospace', marginRight: 12 }}>
                    {device.batteryLevel}%
                  </Text>
                  <Signal size={14} color="#00C2FF" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#CBD5E1', fontSize: 11, fontFamily: 'monospace' }}>
                    {device.signalRSSI} dBm
                  </Text>
                </View>
                <Text style={{ color: '#64748B', fontSize: 10, fontFamily: 'monospace' }}>Type: {device.type}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}