import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type Timeframe = 'daily' | 'weekly' | 'monthly';

export interface TimeframePickerProps {
  selected: Timeframe;
  onSelect: (timeframe: Timeframe) => void;
}

export const TimeframePicker: React.FC<TimeframePickerProps> = ({
  selected,
  onSelect,
}) => {
  const options: { key: Timeframe; label: string }[] = [
    { key: 'daily', label: '24 HOURS' },
    { key: 'weekly', label: '7 DAYS' },
    { key: 'monthly', label: '30 DAYS' },
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isSelected = selected === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[styles.button, isSelected && styles.buttonSelected]}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#091524',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  buttonSelected: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  label: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  labelSelected: {
    color: '#00C2FF',
  },
});
