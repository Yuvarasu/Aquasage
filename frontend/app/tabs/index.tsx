import React, { useEffect } from 'react';
import { ScrollView, View, Text, StatusBar, RefreshControl } from 'react-native';
import { PipelineSchematic } from '../../src/components/digitalTwin/PipelineSchematic';
import { useTelemetryStore } from '../../src/store/useTelemetryStore';
import { ApiService } from '../../src/services/apiService';
import { socketService } from '../../src/services/socketService';
import { mockSimulator } from '../../src/services/mockSimulator';
import { ConnectionBanner } from '../../src/components/ui/ConnectionBanner';
import { MetricTile } from '../../src/components/ui/MetricTile';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { 
  Activity, 
  Gauge, 
  AlertTriangle, 
  Fan, 
  Droplets,
  Zap,
  FlaskConical
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { data, updateTelemetry, isSimulating, connectionState } = useTelemetryStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const syncTelemetry = async () => {
    setRefreshing(true);
    const latest = await ApiService.fetchLatestTelemetry();
    if (latest) {
      updateTelemetry(latest, 'rest_polling');
    }
    setRefreshing(false);
  };

  useEffect(() => {
    // 1. Connect WebSocket to live backend stream
    socketService.connect();

    // 2. Fetch initial telemetry snapshot from backend REST API
    syncTelemetry();

    // 3. Fallback active polling every 3 seconds to guarantee updates if WS drops or on mobile
    const pollInterval = setInterval(() => {
      syncTelemetry();
    }, 3000);

    // 4. Fallback simulation control
    if (isSimulating) {
      mockSimulator.start();
    } else {
      mockSimulator.stop();
    }

    return () => {
      clearInterval(pollInterval);
      mockSimulator.stop();
    };
  }, [isSimulating]);

  // Derived state calculations for 25.0 cm tank calibration
  const isPressureHigh = data.pressure > 5.0;
  const isLeakDetected = data.leakProbability > 0.4;
  const isPumpRunning = data.pumpStatus === 'running';

  const tankHeightCm = 25.0;
  const currentWaterHeightCm = data.water_height_cm ?? Number(((data.tankLevel / 100) * tankHeightCm).toFixed(1));
  const isCriticalLow = currentWaterHeightCm <= 5.0 || data.tankLevel <= 20.0;
  const isNearOverflow = currentWaterHeightCm >= 20.0 || data.tankLevel >= 80.0;

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- TOP APP HEADER --- */}
      <View style={{ paddingTop: 48, paddingBottom: 10, paddingHorizontal: 20, backgroundColor: '#071426', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 2 }}>AQUASAGE</Text>
          <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
            25cm BENCHTOP TWIN • {currentWaterHeightCm.toFixed(1)} cm
          </Text>
        </View>
      </View>

      {/* --- LIVE CONNECTION DIAGNOSTIC BANNER --- */}
      <ConnectionBanner />

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={syncTelemetry}
            tintColor="#00C2FF"
            colors={['#00C2FF']}
          />
        }
      >
        {/* --- HERO STATUS CARD --- */}
        <GlassCard variant={isCriticalLow ? 'red' : 'cyan'} style={{ marginBottom: 12 }} padding={14}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
                Primary Distribution Matrix
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                Tank #1 (25cm Calibrated Storage) • Depth: {currentWaterHeightCm.toFixed(1)} cm
              </Text>
            </View>
            <View style={{ backgroundColor: isCriticalLow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: isCriticalLow ? '#EF4444' : '#00C2FF', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}>
                {isCriticalLow ? 'CRITICAL LOW (<=5cm)' : `${data.tankCapacityLiters || 20}L CAP`}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* --- DIGITAL TWIN PIPELINE SCHEMATIC --- */}
        <View style={{ marginVertical: 4 }}>
          <PipelineSchematic />
        </View>

        {/* --- METRICS GRID --- */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 }}>
          {/* 1. Pressure Transducer */}
          <MetricTile
            label="Line Pressure"
            value={data.pressure.toFixed(2)}
            unit="BAR"
            icon={Gauge}
            iconColor={isPressureHigh ? '#EF4444' : '#00C2FF'}
            variant={isPressureHigh ? 'red' : 'cyan'}
            statusText={isPressureHigh ? 'HIGH SURGE' : 'OPTIMAL'}
            statusColor={isPressureHigh ? '#EF4444' : '#10B981'}
            statusBg={isPressureHigh ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}
          />

          {/* 2. Flow Rate Meter */}
          <MetricTile
            label="Discharge Flow"
            value={data.flowRate.toFixed(1)}
            unit="L/min"
            icon={Activity}
            iconColor="#38BDF8"
            variant="cyan"
            statusText={data.flowRate > 0 ? 'ACTIVE FLOW' : 'STATIC'}
            statusColor={data.flowRate > 0 ? '#38BDF8' : '#94A3B8'}
            statusBg={data.flowRate > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.15)'}
          />

          {/* 3. Tank Level (25cm Calibrated) */}
          <MetricTile
            label="Tank Water Depth"
            value={`${currentWaterHeightCm.toFixed(1)}`}
            unit="cm"
            icon={Droplets}
            iconColor={isCriticalLow ? '#EF4444' : '#06B6D4'}
            variant={isCriticalLow ? 'red' : 'cyan'}
            progressPercent={data.tankLevel}
            statusText={isCriticalLow ? 'ALERT (<=5cm)' : isNearOverflow ? 'OVERFLOW (>=20cm)' : 'OPTIMAL'}
            statusColor={isCriticalLow ? '#EF4444' : isNearOverflow ? '#F59E0B' : '#10B981'}
            statusBg={isCriticalLow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)'}
            subtext={`${data.tankLevel.toFixed(0)}% • ${((data.tankLevel / 100) * (data.tankCapacityLiters || 20)).toFixed(1)} / ${data.tankCapacityLiters || 20} L`}
          />

          {/* 4. Leak Risk Index */}
          <MetricTile
            label="Leak Probability"
            value={(data.leakProbability * 100).toFixed(0)}
            unit="%"
            icon={AlertTriangle}
            iconColor={isLeakDetected ? '#EF4444' : '#10B981'}
            variant={isLeakDetected ? 'red' : 'emerald'}
            statusText={isLeakDetected ? 'ANOMALY' : 'SECURE'}
            statusColor={isLeakDetected ? '#EF4444' : '#10B981'}
            statusBg={isLeakDetected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}
          />

          {/* 5. Pump VFD Health */}
          <MetricTile
            label="Pump Health"
            value={`${data.pumpHealthScore}%`}
            icon={Fan}
            iconColor={isPumpRunning ? '#10B981' : '#64748B'}
            variant={isPumpRunning ? 'emerald' : 'slate'}
            statusText={isPumpRunning ? 'RUNNING' : 'STANDBY'}
            statusColor={isPumpRunning ? '#10B981' : '#94A3B8'}
            statusBg={isPumpRunning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)'}
          />

          {/* 6. Water Quality (TDS & Turbidity) */}
          <MetricTile
            label="Water Quality"
            value={data.pHLevel.toFixed(1)}
            unit="pH"
            icon={FlaskConical}
            iconColor="#A855F7"
            variant="cyan"
            statusText={`${data.waterTurbidityNTU.toFixed(2)} NTU • ${data.tdsLevel.toFixed(0)} PPM`}
            statusColor="#C084FC"
            statusBg="rgba(168, 85, 247, 0.15)"
            subtext={`Turb: ${data.waterTurbidityNTU.toFixed(2)} NTU | TDS: ${data.tdsLevel.toFixed(0)} PPM`}
          />
        </View>
      </ScrollView>
    </View>
  );
}