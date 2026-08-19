import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'red' | 'slate' | 'default';
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  style,
  glow = false,
  padding = 16,
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'cyan':
        return 'rgba(6, 182, 212, 0.25)';
      case 'emerald':
        return 'rgba(16, 185, 129, 0.25)';
      case 'amber':
        return 'rgba(245, 158, 11, 0.25)';
      case 'red':
        return 'rgba(239, 68, 68, 0.3)';
      case 'slate':
        return 'rgba(51, 65, 85, 0.6)';
      default:
        return 'rgba(30, 41, 59, 0.8)';
    }
  };

  const getGlowShadow = () => {
    if (!glow) return {};
    switch (variant) {
      case 'cyan':
        return {
          shadowColor: '#06B6D4',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'emerald':
        return {
          shadowColor: '#10B981',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'red':
        return {
          shadowColor: '#EF4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 4,
        };
      default:
        return {};
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: getBorderColor(),
          padding,
        },
        getGlowShadow(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1B2E',
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
});
