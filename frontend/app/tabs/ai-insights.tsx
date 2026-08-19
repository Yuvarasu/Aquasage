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
  Bot,
  Sparkles,
  RefreshCw,
  Play,
  Layers,
  Zap,
} from 'lucide-react-native';
import { useTelemetryStore } from '../../src/store/useTelemetryStore';
import { ApiService } from '../../src/services/apiService';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { AcousticLeakVisualizer } from '../../src/components/ai/AcousticLeakVisualizer';
import { RulDegradationGauge } from '../../src/components/ai/RulDegradationGauge';
import { DemandForecastChart } from '../../src/components/ai/DemandForecastChart';
import { AiTechnicianCopilot } from '../../src/components/ai/AiTechnicianCopilot';

export default function AIInsightsScreen() {
  const { data } = useTelemetryStore();
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [demandForecast, setDemandForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copilotVisible, setCopilotVisible] = useState(false);
  const [inferring, setInferring] = useState(false);

  const loadAiData = async () => {
    setLoading(true);
    try {
      const [summary, forecast] = await Promise.all([
        ApiService.fetchAiInsightsSummary(1),
        ApiService.fetchDemandForecast(1),
      ]);
      if (summary) setAiSummary(summary);
      if (forecast) setDemandForecast(forecast);
    } catch (e) {
      console.warn('AI loading exception:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAiData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAiData();
  };

  const handleManualInference = async () => {
    setInferring(true);
    await ApiService.triggerAiInference(1);
    await loadAiData();
    setInferring(false);
  };

  const isLeakHigh = data.leakProbability > 0.4 || (aiSummary?.anomaly_detected ?? false);
  const estimatedRul = aiSummary?.pump_estimated_rul_hours ?? 3420;
  const pumpHealth = aiSummary?.pump_health_score ?? data.pumpHealthScore ?? 94;

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI INTELLIGENCE</Text>
          <Text style={styles.headerSub}>Neural Network Hydraulic Diagnostics</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setCopilotVisible(true)}
            style={styles.copilotBtn}
            activeOpacity={0.8}
          >
            <Bot size={15} color="#00C2FF" style={{ marginRight: 5 }} />
            <Text style={styles.copilotBtnText}>AI COPILOT</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onRefresh} style={styles.iconBtn} activeOpacity={0.7}>
            <RefreshCw size={15} color="#94A3B8" />
          </TouchableOpacity>
        </View>
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
        {/* --- SYSTEM AI INFERENCE STATUS BANNER --- */}
        <GlassCard variant={isLeakHigh ? 'red' : 'emerald'} style={{ marginBottom: 14 }} padding={14}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View style={[styles.modelIconBox, { backgroundColor: isLeakHigh ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                <Cpu size={16} color={isLeakHigh ? '#EF4444' : '#10B981'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                  Active Neural Inference Engine
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'monospace', marginTop: 1 }}>
                  Model Ensemble v2.4 • 200 Hz Sampling Window
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleManualInference}
              disabled={inferring}
              style={styles.runInferBtn}
              activeOpacity={0.7}
            >
              {inferring ? (
                <ActivityIndicator size="small" color="#00C2FF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Play size={10} color="#00C2FF" style={{ marginRight: 4 }} />
                  <Text style={styles.runInferText}>RE-INFER</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* --- COMPONENT 1: ACOUSTIC LEAK LOCALIZATION RADAR --- */}
        <Text style={styles.sectionHeader}>Acoustic Leak Pinpointing</Text>
        <AcousticLeakVisualizer
          leakProbability={data.leakProbability}
          estimatedDistanceKm={2.4}
          totalPipelineLengthKm={5.2}
          flowLossLmin={14.8}
        />

        {/* --- COMPONENT 2: 24-HOUR DEMAND FORECAST --- */}
        <Text style={styles.sectionHeader}>Predictive Demand Envelope</Text>
        <DemandForecastChart
          forecastPoints={demandForecast?.forecast_points}
          totalProjectedLiters={demandForecast?.total_projected_liters || 21450}
        />

        {/* --- COMPONENT 3: MOTOR PROGNOSTICS & RUL DEGRADATION --- */}
        <Text style={styles.sectionHeader}>Predictive Motor Overhaul Life</Text>
        <RulDegradationGauge
          healthScore={pumpHealth}
          estimatedRulHours={estimatedRul}
          rpm={data.pumpRPM}
        />
      </ScrollView>

      {/* --- AI TECHNICIAN COPILOT MODAL --- */}
      <AiTechnicianCopilot
        visible={copilotVisible}
        onClose={() => setCopilotVisible(false)}
        onInferenceTriggered={loadAiData}
      />
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
  copilotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 194, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
  },
  copilotBtnText: {
    color: '#00C2FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#0D1B2E',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  runInferBtn: {
    backgroundColor: 'rgba(0, 194, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  runInferText: {
    color: '#00C2FF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 2,
    paddingHorizontal: 4,
  },
});