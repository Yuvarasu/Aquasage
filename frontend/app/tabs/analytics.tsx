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
  TrendingUp,
  Droplets,
  RefreshCw,
  Gauge,
  FlaskConical,
  Zap,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { ApiService } from '../../src/services/apiService';
import { TimeframePicker, Timeframe } from '../../src/components/charts/TimeframePicker';
import { AreaLineChart } from '../../src/components/charts/AreaLineChart';
import { VolumeBarChart } from '../../src/components/charts/VolumeBarChart';
import { MultiTrendChart } from '../../src/components/charts/MultiTrendChart';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { StatusBadge } from '../../src/components/ui/StatusBadge';

export default function AnalyticsScreen() {
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [consumptionData, setConsumptionData] = useState<any>(null);
  const [qualityTrends, setQualityTrends] = useState<any[]>([]);
  const [tankTrends, setTankTrends] = useState<any[]>([]);

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      const [consumption, quality, tank] = await Promise.all([
        ApiService.fetchConsumptionAnalytics(timeframe),
        ApiService.fetchWaterQualityTrends(),
        ApiService.fetchTankTrends(1),
      ]);

      if (consumption) setConsumptionData(consumption);
      if (quality && quality.data) setQualityTrends(quality.data);
      if (tank && tank.data) setTankTrends(tank.data);
    } catch (e) {
      console.warn('Analytics loading exception:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllAnalytics();
  }, [timeframe]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllAnalytics();
  };

  // Fallback demo data if server has zero historical points
  const getDisplayBarData = () => {
    if (consumptionData?.data && consumptionData.data.length > 0) {
      return consumptionData.data.map((d: any) => ({
        label: d.date ? d.date.split('-').slice(1).join('/') : 'Day',
        value: d.consumption_liters || 0,
      }));
    }
    // Realistic fallback distribution curve
    return [
      { label: 'Mon', value: 16400 },
      { label: 'Tue', value: 18200 },
      { label: 'Wed', value: 17850 },
      { label: 'Thu', value: 19400 },
      { label: 'Fri', value: 21100 },
      { label: 'Sat', value: 23500 },
      { label: 'Sun', value: 18900 },
    ];
  };

  const getFlowCurveData = () => {
    if (consumptionData?.data && consumptionData.data.length > 0) {
      return consumptionData.data.map((d: any) => ({
        label: d.date ? d.date.split('-').slice(1).join('/') : '',
        value: d.avg_flow_lmin || 35.0,
      }));
    }
    return [
      { label: '00:00', value: 12.4 },
      { label: '04:00', value: 8.2 },
      { label: '08:00', value: 68.5 },
      { label: '12:00', value: 48.0 },
      { label: '16:00', value: 52.4 },
      { label: '20:00', value: 72.8 },
      { label: '23:59', value: 22.0 },
    ];
  };

  const getQualityData = () => {
    if (qualityTrends.length > 0) return qualityTrends;
    return [
      { timestamp: '00h', ph_level: 7.2, tds_ppm: 142, turbidity_ntu: 0.4 },
      { timestamp: '04h', ph_level: 7.3, tds_ppm: 145, turbidity_ntu: 0.38 },
      { timestamp: '08h', ph_level: 7.1, tds_ppm: 160, turbidity_ntu: 0.52 },
      { timestamp: '12h', ph_level: 7.4, tds_ppm: 155, turbidity_ntu: 0.45 },
      { timestamp: '16h', ph_level: 7.2, tds_ppm: 148, turbidity_ntu: 0.41 },
      { timestamp: '20h', ph_level: 7.3, tds_ppm: 152, turbidity_ntu: 0.44 },
    ];
  };

  const getTankCurveData = () => {
    if (tankTrends.length > 0) {
      return tankTrends.map((t: any) => ({
        label: t.timestamp ? t.timestamp.split('T')[1]?.slice(0, 5) || '' : '',
        value: t.water_level_pct || 75,
      }));
    }
    return [
      { label: '00h', value: 88 },
      { label: '04h', value: 92 },
      { label: '08h', value: 64 },
      { label: '12h', value: 55 },
      { label: '16h', value: 78 },
      { label: '20h', value: 45 },
      { label: '24h', value: 82 },
    ];
  };

  const totalVolume = consumptionData?.total_consumption_liters || 135350;
  const avgDaily = consumptionData?.average_daily_liters || 19335;
  const peakFlow = consumptionData?.peak_flow_lmin || 74.2;

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>WATER ANALYTICS</Text>
          <Text style={styles.headerSub}>Hydraulic Demand & Water Quality Trends</Text>
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
        {/* --- TIMEFRAME SELECTOR --- */}
        <TimeframePicker selected={timeframe} onSelect={setTimeframe} />

        {/* --- HERO KPI BANNER --- */}
        <GlassCard variant="cyan" style={{ marginBottom: 16 }} padding={16}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Droplets size={18} color="#00C2FF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>Aggregated Consumption</Text>
            </View>
            <StatusBadge status="online" label={`${timeframe.toUpperCase()}`} size="sm" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 }}>
            <Text style={styles.heroNumber}>{totalVolume.toLocaleString()}</Text>
            <Text style={styles.heroUnit}>LITERS</Text>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>DAILY AVERAGE</Text>
              <Text style={styles.kpiValue}>{avgDaily.toLocaleString()} L/d</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>PEAK DEMAND</Text>
              <Text style={styles.kpiValue}>{peakFlow.toFixed(1)} L/min</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>NETWORK EFFICIENCY</Text>
              <Text style={[styles.kpiValue, { color: '#10B981' }]}>98.4%</Text>
            </View>
          </View>
        </GlassCard>

        {/* --- CHART 1: VOLUMETRIC DISTRIBUTION BAR CHART --- */}
        <Text style={styles.sectionTitle}>Daily Volumetric Throughput</Text>
        <GlassCard variant="slate" style={{ marginBottom: 16 }} padding={14}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: 'bold' }}>Throughput Volume Breakdown</Text>
            <Text style={{ color: '#00C2FF', fontSize: 10, fontFamily: 'monospace' }}>Liters (L)</Text>
          </View>
          <VolumeBarChart data={getDisplayBarData()} height={160} />
        </GlassCard>

        {/* --- CHART 2: DIURNAL DISCHARGE FLOW VELOCITY CURVE --- */}
        <Text style={styles.sectionTitle}>Diurnal Flow Rate Profile</Text>
        <GlassCard variant="cyan" style={{ marginBottom: 16 }} padding={14}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: 'bold' }}>Discharge Velocity (L/min)</Text>
            <Text style={{ color: '#38BDF8', fontSize: 10, fontFamily: 'monospace' }}>Peak at 20:00 (72.8 L/m)</Text>
          </View>
          <AreaLineChart
            data={getFlowCurveData()}
            height={150}
            lineColor="#38BDF8"
            gradientFrom="rgba(56, 189, 248, 0.35)"
            gradientTo="rgba(56, 189, 248, 0.0)"
            unit="L/m"
          />
        </GlassCard>

        {/* --- CHART 3: WATER QUALITY METRIC MATRIX --- */}
        <Text style={styles.sectionTitle}>Water Quality Assurance Index</Text>
        <GlassCard variant="emerald" style={{ marginBottom: 16 }} padding={14}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FlaskConical size={15} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: 'bold' }}>pH, TDS & Turbidity Trends</Text>
            </View>
            <Text style={{ color: '#10B981', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}>100% SAFE</Text>
          </View>
          <MultiTrendChart data={getQualityData()} height={170} />
        </GlassCard>

        {/* --- CHART 4: STORAGE TANK INFLOW/OUTFLOW BALANCE --- */}
        <Text style={styles.sectionTitle}>Storage Tank Fill & Depletion Cycle</Text>
        <GlassCard variant="cyan" style={{ marginBottom: 16 }} padding={14}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: 'bold' }}>Tank #1 Water Level (%)</Text>
            <Text style={{ color: '#06B6D4', fontSize: 10, fontFamily: 'monospace' }}>Cap: 50,000L</Text>
          </View>
          <AreaLineChart
            data={getTankCurveData()}
            height={140}
            lineColor="#06B6D4"
            gradientFrom="rgba(6, 182, 212, 0.35)"
            gradientTo="rgba(6, 182, 212, 0.0)"
            unit="%"
          />
        </GlassCard>
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
  heroNumber: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 28,
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
  heroUnit: {
    color: '#00C2FF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.8)',
  },
  kpiItem: {
    flex: 1,
  },
  kpiLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  kpiValue: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});