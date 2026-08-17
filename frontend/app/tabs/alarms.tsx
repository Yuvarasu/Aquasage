import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertTriangle, Bell, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react-native';
import { ApiService } from '../../src/services/apiService';
import { useAlertStore } from '../../src/store/useAlertStore';
import { SCADAAlarm } from '../../src/types/telemetry';

export default function AlarmsScreen() {
  const { alarms, acknowledgeAlarm } = useAlertStore();
  const [loading, setLoading] = useState(false);
  const [activeAlarms, setActiveAlarms] = useState<SCADAAlarm[]>([]);

  const loadBackendAlarms = async () => {
    setLoading(true);
    const fetched = await ApiService.fetchAlarms();
    if (fetched && fetched.length > 0) {
      setActiveAlarms(fetched);
    } else {
      setActiveAlarms(alarms);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBackendAlarms();
  }, [alarms]);

  const handleAcknowledge = async (id: string) => {
    acknowledgeAlarm(id);
    await ApiService.acknowledgeAlarm(id);
    loadBackendAlarms();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#071426', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 2 }}>SCADA ALARMS</Text>
          <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
            Real-Time Alert Notifications
          </Text>
        </View>

        <TouchableOpacity onPress={loadBackendAlarms} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#10233A', borderWidth: 1, borderColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={16} color="#00C2FF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color="#00C2FF" style={{ marginTop: 20 }} />
        ) : activeAlarms.length === 0 ? (
          <View style={{ backgroundColor: '#10233A', borderRadius: 16, padding: 24, alignItems: 'center', marginVertical: 20, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.2)' }}>
            <CheckCircle2 size={32} color="#4ADE80" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>All Systems Normal</Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>No active SCADA alarms detected.</Text>
          </View>
        ) : (
          activeAlarms.map((alarm) => {
            const isCritical = alarm.severity === 'critical';
            return (
              <View
                key={alarm.id}
                style={{
                  backgroundColor: '#10233A',
                  borderWidth: 1,
                  borderColor: isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(250, 204, 21, 0.3)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {isCritical ? <ShieldAlert size={18} color="#EF4444" style={{ marginRight: 8 }} /> : <AlertTriangle size={18} color="#FACC15" style={{ marginRight: 8 }} />}
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>{alarm.title}</Text>
                  </View>
                  <View style={{ backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(250, 204, 21, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ color: isCritical ? '#EF4444' : '#FACC15', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {alarm.severity}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 18, marginBottom: 12 }}>{alarm.message}</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(30, 41, 59, 0.6)' }}>
                  <Text style={{ color: '#64748B', fontSize: 10, fontFamily: 'monospace' }}>
                    Node: {alarm.sourceNode} • {alarm.timestamp}
                  </Text>

                  {alarm.acknowledged ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <CheckCircle2 size={12} color="#4ADE80" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#4ADE80', fontSize: 10, fontWeight: 'bold' }}>ACKNOWLEDGED</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleAcknowledge(alarm.id)}
                      style={{ backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>ACKNOWLEDGE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}