import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  Activity,
  Gauge,
  Droplets,
  Fan,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Sliders,
  CheckCircle2,
} from 'lucide-react-native';
import { TelemetryData } from '../../types/telemetry';
import { GlassCard } from '../ui/GlassCard';
import { StatusBadge } from '../ui/StatusBadge';

export type NodeType =
  | 'SOURCE_RESERVOIR'
  | 'PUMP_01'
  | 'PRESSURE_SEN_01'
  | 'FLOW_SEN_01'
  | 'VILLAGE_TANK'
  | 'TOWN_GRID';

export interface NodeDetailModalProps {
  visible: boolean;
  nodeType: NodeType | null;
  telemetry: TelemetryData;
  onClose: () => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  visible,
  nodeType,
  telemetry,
  onClose,
}) => {
  if (!nodeType) return null;

  const getNodeInfo = () => {
    switch (nodeType) {
      case 'SOURCE_RESERVOIR':
        return {
          title: 'Intake Source Reservoir',
          tag: 'SRC-01',
          icon: Droplets,
          iconColor: '#00C2FF',
          status: 'online' as const,
          statusLabel: 'SUPPLY ACTIVE',
          description: 'Primary groundwater intake and pre-filtration header reservoir.',
          metrics: [
            { label: 'Intake Pressure', value: '1.85 BAR', normal: '1.5 - 2.2 BAR' },
            { label: 'Water Temperature', value: '21.4 °C', normal: '18 - 26 °C' },
            { label: 'Turbidity', value: `${telemetry.waterTurbidityNTU} NTU`, normal: '< 1.0 NTU' },
            { label: 'Intake Valve', value: 'OPEN (100%)', normal: 'Nominal' },
          ],
        };

      case 'PUMP_01':
        return {
          title: 'Centrifugal Booster Pump 01',
          tag: 'PUMP-VFD-01',
          icon: Fan,
          iconColor: telemetry.pumpStatus === 'running' ? '#10B981' : '#64748B',
          status: telemetry.pumpStatus === 'running' ? ('running' as const) : telemetry.pumpStatus === 'fault' ? ('critical' as const) : ('offline' as const),
          statusLabel: telemetry.pumpStatus.toUpperCase(),
          description: 'Variable frequency drive centrifugal pump delivering pressurized main flow.',
          metrics: [
            { label: 'Motor Speed', value: `${telemetry.pumpRPM} RPM`, normal: '1200 - 1600 RPM' },
            { label: 'Health Score', value: `${telemetry.pumpHealthScore}%`, normal: '> 85%' },
            { label: 'Vibration RMS', value: '1.42 mm/s', normal: '< 2.8 mm/s' },
            { label: 'Motor Power Draw', value: '4.8 kW', normal: '< 7.5 kW' },
          ],
        };

      case 'PRESSURE_SEN_01':
        return {
          title: 'Piezoelectric Pressure Transducer',
          tag: 'PT-01',
          icon: Gauge,
          iconColor: telemetry.pressure > 5.0 ? '#EF4444' : '#00C2FF',
          status: telemetry.pressure > 5.0 ? ('critical' as const) : ('online' as const),
          statusLabel: telemetry.pressure > 5.0 ? 'SURGE DETECTED' : 'NORMAL RANGE',
          description: 'High-frequency line transducer sampling transmission header pressure at 200 Hz.',
          metrics: [
            { label: 'Current Pressure', value: `${telemetry.pressure.toFixed(2)} BAR`, normal: '2.5 - 5.0 BAR' },
            { label: '24h Peak', value: '4.95 BAR', normal: '< 5.5 BAR' },
            { label: '24h Minimum', value: '3.10 BAR', normal: '> 2.0 BAR' },
            { label: 'Sampling Rate', value: '200 Hz', normal: 'Optimal' },
          ],
        };

      case 'FLOW_SEN_01':
        return {
          title: 'Electromagnetic Flow Transmitter',
          tag: 'FT-01',
          icon: Activity,
          iconColor: '#38BDF8',
          status: telemetry.flowRate > 0 ? ('online' as const) : ('idle' as const),
          statusLabel: telemetry.flowRate > 0 ? 'METERING' : 'ZERO FLOW',
          description: 'Electromagnetic full-bore flow meter measuring discharge volume velocity.',
          metrics: [
            { label: 'Flow Velocity', value: `${telemetry.flowRate.toFixed(1)} L/min`, normal: '10 - 90 L/min' },
            { label: 'Daily Totalizer', value: `${telemetry.dailyConsumptionLiters.toLocaleString()} L`, normal: 'Accumulating' },
            { label: 'Reynolds Regime', value: telemetry.flowRate > 30 ? 'Turbulent (Re=4200)' : 'Laminar', normal: 'Nominal' },
            { label: 'Signal Quality', value: '99.8%', normal: '> 95%' },
          ],
        };

      case 'VILLAGE_TANK':
        return {
          title: 'Elevated Storage Tank #1',
          tag: 'TNK-01',
          icon: Droplets,
          iconColor: '#06B6D4',
          status: 'online' as const,
          statusLabel: 'STORAGE NOMINAL',
          description: '50,000 Liters elevated gravity storage reservoir supplying village sectors.',
          metrics: [
            { label: 'Level Percentage', value: `${telemetry.tankLevel.toFixed(0)}%`, normal: '20% - 95%' },
            { label: 'Current Net Volume', value: `${Math.round((telemetry.tankLevel / 100) * 50000).toLocaleString()} L`, normal: 'Cap: 50,000L' },
            { label: 'pH Level', value: `${telemetry.pHLevel.toFixed(1)}`, normal: '6.5 - 8.5' },
            { label: 'Water Turbidity', value: `${telemetry.waterTurbidityNTU} NTU`, normal: '< 1.0 NTU' },
          ],
        };

      case 'TOWN_GRID':
      default:
        return {
          title: 'Village Distribution Sector Alpha',
          tag: 'GRID-01',
          icon: ShieldCheck,
          iconColor: '#10B981',
          status: 'online' as const,
          statusLabel: 'GRID STABLE',
          description: 'Downstream gravity delivery network supplying 142 household connections.',
          metrics: [
            { label: 'Service Connections', value: '142 Households', normal: '100% Active' },
            { label: 'Delivery Head', value: '2.4 BAR', normal: '2.0 - 3.0 BAR' },
            { label: 'Leak Probability', value: `${(telemetry.leakProbability * 100).toFixed(0)}%`, normal: '< 20%' },
            { label: 'Water Quality Score', value: '98 / 100', normal: '> 90' },
          ],
        };
    }
  };

  const info = getNodeInfo();
  const Icon = info.icon;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View style={[styles.iconBox, { backgroundColor: `${info.iconColor}1A` }]}>
                <Icon size={20} color={info.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {info.title}
                </Text>
                <Text style={styles.tag}>{info.tag} • SCADA Node Diagnostic</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            {/* Status Strip */}
            <View style={styles.statusStrip}>
              <StatusBadge status={info.status} label={info.statusLabel} />
              <Text style={styles.timestampText}>
                Live • {new Date().toLocaleTimeString()}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>{info.description}</Text>

            {/* Engineering Metrics Grid */}
            <Text style={styles.sectionHeader}>Operational Parameters</Text>
            <View style={styles.metricsGrid}>
              {info.metrics.map((m, idx) => (
                <View key={idx} style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  <Text style={styles.metricValue}>{m.value}</Text>
                  <Text style={styles.metricNormal}>Range: {m.normal}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.actionBtn, { backgroundColor: '#0284C7' }]}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>DISMISS DIAGNOSTIC</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0A1626',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    padding: 20,
    paddingBottom: 32,
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  tag: {
    color: '#00C2FF',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timestampText: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  description: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#0D1B2E',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  metricNormal: {
    color: '#10B981',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
});
