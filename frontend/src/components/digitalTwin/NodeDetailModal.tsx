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
  Droplets,
  ShieldCheck,
  CheckCircle2,
  Filter,
  GaugeCircle,
  Power,
} from 'lucide-react-native';
import { TelemetryData } from '../../types/telemetry';
import { StatusBadge } from '../ui/StatusBadge';

export type NodeType =
  | 'SOURCE_RESERVOIR'
  | 'BALL_VALVE'
  | 'FLOW_SEN_01'
  | 'SENSING_UNIT'
  | 'FILTRATION_UNIT'
  | 'FLOW_SEN_02'
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

  const waterGood =
    telemetry.waterTurbidityNTU < 1.0 &&
    telemetry.pHLevel >= 6.5 &&
    telemetry.pHLevel <= 8.5 &&
    telemetry.tdsLevel < 600;

  const postFiltTurb = telemetry.waterTurbidityNTU * 0.35;
  const postFiltTDS = telemetry.tdsLevel * 0.4;
  const postFiltGood = postFiltTurb < 0.5 && postFiltTDS < 400;

  const getNodeInfo = () => {
    switch (nodeType) {
      case 'SOURCE_RESERVOIR':
        return {
          title: 'Overhead Source Tank',
          tag: 'SRC-01',
          icon: Droplets,
          iconColor: '#00C2FF',
          status: telemetry.tankLevel < 15 ? ('warning' as const) : ('online' as const),
          statusLabel: telemetry.tankLevel < 15 ? 'LOW LEVEL' : 'SUPPLY ACTIVE',
          description:
            'Elevated storage tank feeding the main PVC pipeline through the ball valve. Raw water source for the treatment train.',
          metrics: [
            { label: 'Tank Level', value: `${telemetry.tankLevel.toFixed(0)}%`, normal: '20% - 95%' },
            {
              label: 'Current Volume',
              value: `${Math.round((telemetry.tankLevel / 100) * 50000).toLocaleString()} L`,
              normal: 'Cap: 50,000 L',
            },
            { label: 'Water Temperature', value: '21.4 °C', normal: '18 - 26 °C' },
            { label: 'Outlet Valve', value: telemetry.valveStatus, normal: 'OPEN' },
          ],
        };

      case 'BALL_VALVE':
        return {
          title: 'Manual Ball Valve',
          tag: 'BV-01',
          icon: Power,
          iconColor: telemetry.valveStatus === 'CLOSED' ? '#EF4444' : '#38BDF8',
          status: telemetry.valveStatus === 'CLOSED' ? ('critical' as const) : ('online' as const),
          statusLabel: telemetry.valveStatus === 'CLOSED' ? 'CLOSED' : 'OPEN',
          description:
            'Manual quarter-turn ball valve isolating the overhead tank from the main pipeline. Blue handle indicates manual operation.',
          metrics: [
            { label: 'Valve Position', value: telemetry.valveStatus, normal: 'OPEN' },
            { label: 'Turn Type', value: 'Quarter-turn (90°)', normal: '—' },
            { label: 'Bore Size', value: '25 mm', normal: '—' },
            { label: 'Body Material', value: 'PVC', normal: '—' },
          ],
        };

      case 'FLOW_SEN_01':
        return {
          title: 'YF-S201 Inline Flow Sensor (Inlet)',
          tag: 'FT-01',
          icon: Activity,
          iconColor: '#38BDF8',
          status: telemetry.flowRate > 0 ? ('online' as const) : ('idle' as const),
          statusLabel: telemetry.flowRate > 0 ? 'METERING' : 'ZERO FLOW',
          description:
            'Hall-effect inline flow sensor clamped on the main pipe measuring incoming raw water flow before the sensing unit.',
          metrics: [
            { label: 'Flow Rate', value: `${telemetry.flowRate.toFixed(1)} L/min`, normal: '10 - 90 L/min' },
            {
              label: 'Daily Totalizer',
              value: `${telemetry.dailyConsumptionLiters.toLocaleString()} L`,
              normal: 'Accumulating',
            },
            { label: 'Signal Quality', value: '99.4%', normal: '> 95%' },
            { label: 'Sensor Type', value: 'YF-S201', normal: 'Hall-effect' },
          ],
        };

      case 'SENSING_UNIT':
        return {
          title: 'Inline Sensing Unit',
          tag: 'SU-01',
          icon: GaugeCircle,
          iconColor: waterGood ? '#10B981' : '#F59E0B',
          status: waterGood ? ('online' as const) : ('warning' as const),
          statusLabel: waterGood ? 'WATER GOOD' : 'CONTAMINATED',
          description:
            'Single inline sensing cluster with turbidity, TDS, and pH probes tapping the main pipe via a T-junction.',
          metrics: [
            {
              label: 'Turbidity',
              value: `${telemetry.waterTurbidityNTU.toFixed(2)} NTU`,
              normal: '< 1.0 NTU',
            },
            { label: 'TDS', value: `${telemetry.tdsLevel.toFixed(0)} ppm`, normal: '< 600 ppm' },
            {
              label: 'pH',
              value: `${telemetry.pHLevel.toFixed(1)}`,
              normal: '6.5 - 8.5',
            },
            { label: 'Verdict', value: waterGood ? 'GOOD' : 'CONTAMINATED', normal: 'GOOD' },
          ],
        };

      case 'FILTRATION_UNIT':
        return {
          title: 'Multi-Stage Filtration Unit',
          tag: 'FLT-01',
          icon: Filter,
          iconColor: waterGood ? '#10B981' : '#F59E0B',
          status: waterGood ? ('idle' as const) : ('running' as const),
          statusLabel: waterGood ? 'STANDBY' : 'FILTERING',
          description:
            'Sediment + carbon + RO filtration stages tapping the pipe via a T-junction, removing turbidity, TDS, and contaminants.',
          metrics: [
            { label: 'Stage 1 (Sediment)', value: waterGood ? 'IDLE' : 'ACTIVE', normal: 'Nominal' },
            { label: 'Stage 2 (Carbon)', value: waterGood ? 'IDLE' : 'ACTIVE', normal: 'Nominal' },
            { label: 'Stage 3 (RO)', value: waterGood ? 'IDLE' : 'ACTIVE', normal: 'Nominal' },
            {
              label: 'TDS Removal',
              value: waterGood ? '—' : '~60%',
              normal: '> 55%',
            },
          ],
        };

      case 'FLOW_SEN_02':
        return {
          title: 'YF-S201 Inline Flow Sensor (Post-Filtration)',
          tag: 'FT-02',
          icon: Activity,
          iconColor: '#22D3EE',
          status: telemetry.flowRate > 0 ? ('online' as const) : ('idle' as const),
          statusLabel: telemetry.flowRate > 0 ? 'METERING' : 'ZERO FLOW',
          description:
            'Inline flow sensor measuring treated water flow returning from the filtration unit toward the village.',
          metrics: [
            {
              label: 'Flow Rate',
              value: `${(telemetry.flowRate * 0.97).toFixed(1)} L/min`,
              normal: '10 - 90 L/min',
            },
            { label: 'Treatment Loss', value: '~3.0%', normal: '< 5%' },
            { label: 'Signal Quality', value: '99.2%', normal: '> 95%' },
            { label: 'Sensor Type', value: 'YF-S201', normal: 'Hall-effect' },
          ],
        };

      case 'VILLAGE_TANK':
        return {
          title: 'Village Storage Tank',
          tag: 'TNK-01',
          icon: Droplets,
          iconColor: '#06B6D4',
          status: 'online' as const,
          statusLabel: 'STORAGE NOMINAL',
          description:
            'Elevated gravity storage reservoir receiving clean water from the pipeline and supplying the village distribution grid.',
          metrics: [
            { label: 'Level Percentage', value: `${telemetry.tankLevel.toFixed(0)}%`, normal: '20% - 95%' },
            {
              label: 'Current Net Volume',
              value: `${Math.round((telemetry.tankLevel / 100) * 50000).toLocaleString()} L`,
              normal: 'Cap: 50,000 L',
            },
            { label: 'pH Level', value: `${telemetry.pHLevel.toFixed(1)}`, normal: '6.5 - 8.5' },
            {
              label: 'Water Turbidity',
              value: `${telemetry.waterTurbidityNTU.toFixed(2)} NTU`,
              normal: '< 1.0 NTU',
            },
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
          description:
            'Downstream gravity delivery network supplying 142 household connections across the village.',
          metrics: [
            { label: 'Service Connections', value: '142 Households', normal: '100% Active' },
            { label: 'Delivery Head', value: '2.4 BAR', normal: '2.0 - 3.0 BAR' },
            {
              label: 'Leak Probability',
              value: `${(telemetry.leakProbability * 100).toFixed(0)}%`,
              normal: '< 20%',
            },
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
            <View style={styles.statusStrip}>
              <StatusBadge status={info.status} label={info.statusLabel} />
              <Text style={styles.timestampText}>
                Live • {new Date().toLocaleTimeString()}
              </Text>
            </View>

            <Text style={styles.description}>{info.description}</Text>

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