import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Bot,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  HelpCircle,
  Cpu,
} from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { ApiService } from '../../services/apiService';

export interface AiTechnicianCopilotProps {
  visible: boolean;
  onClose: () => void;
  onInferenceTriggered?: () => void;
}

export const AiTechnicianCopilot: React.FC<AiTechnicianCopilotProps> = ({
  visible,
  onClose,
  onInferenceTriggered,
}) => {
  const [runningInference, setRunningInference] = useState(false);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  const queryPlaybooks: Record<
    string,
    { title: string; rootCause: string; confidence: string; sop: string[] }
  > = {
    leak_diagnosis: {
      title: 'Acoustic Cross-Correlation Leak Analysis',
      rootCause:
        'Transient pressure drop correlated with micro-burst acoustic spikes detected at 200 Hz between Transducer PT-01 and Valve SOL-01.',
      confidence: '96.4% Neural Confidence',
      sop: [
        '1. Verify telemetry pressure differential across Sector Alpha header pipe.',
        '2. Throttle Solenoid Valve SOL-01 to 50% to mitigate water loss.',
        '3. Inspect physical pipe joint B-14 at KM 2.4 with portable acoustic ground microphone.',
        '4. Deploy clamp sleeve or execute joint weld repair if seal breach is visible.',
      ],
    },
    pump_prognostics: {
      title: 'Centrifugal Pump VFD Health Assessment',
      rootCause:
        'Vibration harmonics (1.42 mm/s RMS) indicate uniform laminar bearing wear with zero cavitation signatures under current 1450 RPM operating load.',
      confidence: '98.1% Prognostic Confidence',
      sop: [
        '1. Ensure bearing lubrication schedule is maintained at 500-hour intervals.',
        '2. Inspect suction head strainer to prevent air entrainment.',
        '3. Next scheduled overhaul estimated in 3,420 operating hours (~142 days).',
      ],
    },
    water_quality: {
      title: 'Physicochemical Water Quality Verification',
      rootCause:
        'Turbidity (0.4 NTU) and pH level (7.2) fall cleanly inside WHO Potable Water Quality guidelines with zero bacterial growth signatures.',
      confidence: '99.5% Assurance Score',
      sop: [
        '1. Routine filter backwash cycle scheduled every 72 hours.',
        '2. Maintain chlorination injection dosing at 0.5 ppm baseline.',
      ],
    },
  };

  const handleRunInference = async () => {
    setRunningInference(true);
    await ApiService.triggerAiInference(1);
    setRunningInference(false);
    if (onInferenceTriggered) onInferenceTriggered();
  };

  const currentPlaybook = activeQuery ? queryPlaybooks[activeQuery] : null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.iconBox}>
                <Bot size={20} color="#00C2FF" />
              </View>
              <View>
                <Text style={styles.title}>AquaSage AI Technician Copilot</Text>
                <Text style={styles.subtitle}>Hydraulic Expert System & Root-Cause Engine</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
            {/* Quick Query Selector Chips */}
            <Text style={styles.sectionTitle}>Diagnostic Queries</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                onPress={() => setActiveQuery('leak_diagnosis')}
                style={[styles.chip, activeQuery === 'leak_diagnosis' && styles.chipActive]}
                activeOpacity={0.7}
              >
                <AlertTriangle size={13} color={activeQuery === 'leak_diagnosis' ? '#00C2FF' : '#94A3B8'} style={{ marginRight: 6 }} />
                <Text style={[styles.chipText, activeQuery === 'leak_diagnosis' && styles.chipTextActive]}>
                  Leak Localization
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveQuery('pump_prognostics')}
                style={[styles.chip, activeQuery === 'pump_prognostics' && styles.chipActive]}
                activeOpacity={0.7}
              >
                <Cpu size={13} color={activeQuery === 'pump_prognostics' ? '#00C2FF' : '#94A3B8'} style={{ marginRight: 6 }} />
                <Text style={[styles.chipText, activeQuery === 'pump_prognostics' && styles.chipTextActive]}>
                  Pump Health (RUL)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveQuery('water_quality')}
                style={[styles.chip, activeQuery === 'water_quality' && styles.chipActive]}
                activeOpacity={0.7}
              >
                <Sparkles size={13} color={activeQuery === 'water_quality' ? '#00C2FF' : '#94A3B8'} style={{ marginRight: 6 }} />
                <Text style={[styles.chipText, activeQuery === 'water_quality' && styles.chipTextActive]}>
                  Water Safety Index
                </Text>
              </TouchableOpacity>
            </View>

            {/* Playbook Output Card */}
            {currentPlaybook ? (
              <GlassCard variant="cyan" style={{ marginVertical: 10 }} padding={14}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                    {currentPlaybook.title}
                  </Text>
                  <Text style={{ color: '#10B981', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {currentPlaybook.confidence}
                  </Text>
                </View>

                <Text style={styles.rootCauseText}>{currentPlaybook.rootCause}</Text>

                <Text style={styles.sopHeader}>Standard Operating Remediation (SOP):</Text>
                {currentPlaybook.sop.map((step, idx) => (
                  <View key={idx} style={styles.sopStep}>
                    <CheckCircle2 size={12} color="#00C2FF" style={{ marginRight: 6, marginTop: 2 }} />
                    <Text style={styles.sopStepText}>{step}</Text>
                  </View>
                ))}
              </GlassCard>
            ) : (
              <View style={styles.placeholderBox}>
                <HelpCircle size={24} color="#64748B" style={{ marginBottom: 6 }} />
                <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center' }}>
                  Select a diagnostic query above or trigger a live neural network inference pass.
                </Text>
              </View>
            )}

            {/* Live Model Retrain / Re-Inference Action */}
            <TouchableOpacity
              onPress={handleRunInference}
              disabled={runningInference}
              style={styles.inferButton}
              activeOpacity={0.8}
            >
              {runningInference ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Play size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.inferButtonText}>TRIGGER ML RE-INFERENCE PASS</Text>
                </View>
              )}
            </TouchableOpacity>
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
  container: {
    backgroundColor: '#0A1626',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 194, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  subtitle: {
    color: '#00C2FF',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  chipActive: {
    backgroundColor: 'rgba(0, 194, 255, 0.15)',
    borderColor: '#00C2FF',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  chipTextActive: {
    color: '#00C2FF',
  },
  rootCauseText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  sopHeader: {
    color: '#00C2FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sopStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  sopStepText: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  placeholderBox: {
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  inferButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  inferButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
});
