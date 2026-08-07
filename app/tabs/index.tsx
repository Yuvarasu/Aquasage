import React, { useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { PipelineSchematic } from '../../src/components/digitalTwin/PipelineSchematic';
import { useTelemetryStore } from '../../src/store/useTelemetryStore';
import { mockSimulator } from '../../src/services/mockSimulator';
import { 
  Activity, 
  Gauge, 
  AlertTriangle, 
  Fan, 
  Bell, 
  Wifi, 
  BatteryMedium,
  TrendingUp,
  ArrowRight
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { data, updateTelemetry } = useTelemetryStore();

  useEffect(() => {
    mockSimulator.start();
    return () => mockSimulator.stop();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#071426', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 2 }}>AQUA-TWIN</Text>
          <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
            8/3/2026 • 2:43:26 AM
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: 6 }} />
            <Text style={{ color: '#4ADE80', fontSize: 10, fontWeight: 'bold' }}>ONLINE</Text>
          </View>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#10233A', borderWidth: 1, borderColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }}>
            <Wifi size={14} color="#94A3B8" />
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- HERO STATUS SECTION --- */}
        <View style={{ marginBottom: 12, paddingHorizontal: 4 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Water Distribution Network</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: 6 }} />
            <Text style={{ color: '#4ADE80', fontWeight: 'bold', fontSize: 12 }}>Online</Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginLeft: 6 }}>• Monitoring all sensors in real time</Text>
          </View>
        </View>

        {/* --- DIGITAL TWIN PIPELINE SCHEMATIC --- */}
        <View style={{ marginVertical: 8 }}>
        <PipelineSchematic />
      </View>

        {/* --- METRICS GRID --- */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 }}>
          
          {/* 1. Pressure Card */}
          <View style={{ width: '48%', backgroundColor: '#10233A', borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.2)', borderRadius: 16, padding: 16, marginVertical: 6, justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: 'bold' }}>Pressure</Text>
                <Gauge size={16} color="#94A3B8" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 24, fontFamily: 'monospace' }}>{data.pressure.toFixed(2)}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>BAR</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)', marginTop: 6 }}>
                <Text style={{ color: '#4ADE80', fontSize: 9, fontWeight: 'bold' }}>Normal</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(30, 41, 59, 0.6)' }}>
              <TrendingUp size={16} color="#4ADE80" />
              <ArrowRight size={14} color="#64748B" />
            </View>
          </View>

          {/* 2. Flow Rate Card */}
          <View style={{ width: '48%', backgroundColor: '#10233A', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)', borderRadius: 16, padding: 16, marginVertical: 6, justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: 'bold' }}>Flow Rate</Text>
                <Activity size={16} color="#38BDF8" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 24, fontFamily: 'monospace' }}>{data.flowRate.toFixed(1)}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>L/min</Text>
              </View>
              <View style={{ height: 20, marginTop: 6 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(30, 41, 59, 0.6)' }}>
              <TrendingUp size={16} color="#38BDF8" />
              <ArrowRight size={14} color="#64748B" />
            </View>
          </View>

          {/* 3. Tank Level Card */}
          <View style={{ width: '31%', backgroundColor: '#10233A', borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.2)', borderRadius: 16, padding: 12, marginVertical: 6, justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#CBD5E1', fontSize: 11, fontWeight: 'bold' }}>Tank</Text>
                <BatteryMedium size={14} color="#38BDF8" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 20, fontFamily: 'monospace' }}>{data.tankLevel.toFixed(0)}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: 'bold' }}>%</Text>
              </View>
              <View style={{ width: '100%', backgroundColor: '#0F172A', height: 6, borderRadius: 3, overflow: 'hidden', marginVertical: 8, borderWidth: 1, borderColor: '#1E293B' }}>
                <View style={{ width: `${data.tankLevel}%`, backgroundColor: '#38BDF8', height: '100%', borderRadius: 3 }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(30, 41, 59, 0.6)' }}>
              <TrendingUp size={12} color="#38BDF8" />
              <ArrowRight size={12} color="#64748B" />
            </View>
          </View>

          {/* 4. Leak Index Card */}
          <View style={{ width: '31%', backgroundColor: '#10233A', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.2)', borderRadius: 16, padding: 12, marginVertical: 6, justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#CBD5E1', fontSize: 11, fontWeight: 'bold' }}>Leak</Text>
                <AlertTriangle size={14} color="#FACC15" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 20, fontFamily: 'monospace' }}>{(data.leakProbability * 100).toFixed(0)}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: 'bold' }}>%</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)', marginVertical: 8 }}>
                <Text style={{ color: '#4ADE80', fontSize: 8, fontWeight: 'bold' }}>Green</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(30, 41, 59, 0.6)' }}>
              <TrendingUp size={12} color="#4ADE80" />
              <ArrowRight size={12} color="#64748B" />
            </View>
          </View>

          {/* 5. Pump Health Card */}
          <View style={{ width: '31%', backgroundColor: '#10233A', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.2)', borderRadius: 16, padding: 12, marginVertical: 6, justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#CBD5E1', fontSize: 11, fontWeight: 'bold' }}>Pump</Text>
                <Fan size={14} color="#4ADE80" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 20, fontFamily: 'monospace' }}>{data.pumpHealthScore}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: 'bold' }}>%</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)', marginVertical: 8 }}>
                <Text style={{ color: '#4ADE80', fontSize: 8, fontWeight: 'bold' }}>Healthy</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(30, 41, 59, 0.6)' }}>
              <TrendingUp size={12} color="#4ADE80" />
              <ArrowRight size={12} color="#64748B" />
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}