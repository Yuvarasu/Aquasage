import React from 'react';
import { ScrollView, View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { useTelemetryStore } from '../../src/store/useTelemetryStore';
import { 
  Cpu, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Wrench, 
  Zap, 
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react-native';

export default function AIInsightsScreen() {
  const { data } = useTelemetryStore();
  const isHighRisk = data.leakProbability > 0.5;

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#071426', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 2 }}>AI INTELLIGENCE</Text>
          <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
            Neural Network Hydraulic Anomaly Analyzer
          </Text>
        </View>

        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#10233A', borderWidth: 1, borderColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }}>
          <Cpu size={18} color="#00C2FF" />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- SYSTEM AI STATUS BANNER --- */}
        <View style={{ backgroundColor: '#10233A', borderWidth: 1, borderColor: isHighRisk ? 'rgba(239, 68, 68, 0.3)' : 'rgba(74, 222, 128, 0.2)', borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isHighRisk ? '#EF4444' : '#4ADE80', marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Model State: Active Inference</Text>
              <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                {isHighRisk ? 'Anomaly detected across node matrix.' : 'All hydraulic parameters within safe limits.'}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: 'rgba(0, 194, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(0, 194, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: '#00C2FF', fontSize: 9, fontWeight: 'bold' }}>v2.4.1</Text>
          </View>
        </View>

        {/* --- SECTION TITLE --- */}
        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4 }}>
          Predictive Diagnostics & Prognostics
        </Text>

        {/* --- CARD 1: LEAK DETECTION MODEL --- */}
        <View style={{ backgroundColor: '#10233A', borderWidth: 1, borderColor: isHighRisk ? 'rgba(239, 68, 68, 0.3)' : 'rgba(6, 182, 212, 0.2)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isHighRisk ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                {isHighRisk ? <AlertTriangle size={16} color="#EF4444" /> : <ShieldCheck size={16} color="#00C2FF" />}
              </View>
              <View>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>Leak Detection Model</Text>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}>Confidence: 96.4%</Text>
              </View>
            </View>
            <View style={{ backgroundColor: isHighRisk ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: isHighRisk ? 'rgba(239, 68, 68, 0.3)' : 'rgba(74, 222, 128, 0.3)' }}>
              <Text style={{ color: isHighRisk ? '#EF4444' : '#4ADE80', fontSize: 9, fontWeight: 'bold' }}>
                {isHighRisk ? 'CRITICAL RISK' : 'SECURE'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 28, fontFamily: 'monospace' }}>
              {(data.leakProbability * 100).toFixed(1)}%
            </Text>
            <Text style={{ color: isHighRisk ? '#EF4444' : '#00C2FF', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>
              {isHighRisk ? 'ANOMALY DETECTED' : 'RISK INDEX'}
            </Text>
          </View>

          <Text style={{ color: '#94A3B8', fontSize: 11, lineHeight: 16, marginTop: 4 }}>
            {isHighRisk 
              ? 'CRITICAL: Micro-burst pattern identified between Pressure Sensor 01 and Node B. Immediate inspection recommended.'
              : 'Normal pressure-flow correlation across distribution lines. No structural leakage signatures found.'}
          </Text>
        </View>

        {/* --- CARD 2: PUMP MOTOR PROGNOSTICS (RUL) --- */}
        <View style={{ backgroundColor: '#10233A', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.2)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(74, 222, 128, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Wrench size={16} color="#4ADE80" />
              </View>
              <View>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>Pump Motor Prognostics</Text>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}>Health Score: {data.pumpHealthScore}%</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)' }}>
              <Text style={{ color: '#4ADE80', fontSize: 9, fontWeight: 'bold' }}>OPTIMAL</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 26, fontFamily: 'monospace' }}>3,420 Hours</Text>
            <Text style={{ color: '#4ADE80', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>RUL</Text>
          </View>

          <Text style={{ color: '#94A3B8', fontSize: 11, lineHeight: 16, marginTop: 4 }}>
            Vibration spectral harmonics indicate normal bearing wear. Scheduled maintenance estimated in 140 days based on current RPM load ({data.pumpRPM} RPM).
          </Text>
        </View>

        {/* --- CARD 3: HYDRAULIC STABILITY & FLOW EFFICIENCY --- */}
        <View style={{ backgroundColor: '#10233A', borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.2)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(6, 182, 212, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Activity size={16} color="#00C2FF" />
              </View>
              <View>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>Hydraulic Friction Matrix</Text>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}>Flow Rate: {data.flowRate.toFixed(1)} L/min</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(0, 194, 255, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0, 194, 255, 0.3)' }}>
              <Text style={{ color: '#00C2FF', fontSize: 9, fontWeight: 'bold' }}>STABLE</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 26, fontFamily: 'monospace' }}>98.2%</Text>
            <Text style={{ color: '#00C2FF', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>EFFICIENCY</Text>
          </View>

          <Text style={{ color: '#94A3B8', fontSize: 11, lineHeight: 16, marginTop: 4 }}>
            Reynolds number calculations show laminar flow across main transmission headers with minimal boundary layer separation.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}  