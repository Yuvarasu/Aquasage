import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type StatusVariant = 'online' | 'warning' | 'critical' | 'offline' | 'idle' | 'running';

export interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  pulse = true,
  size = 'md',
  style,
}) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (pulse && (status === 'online' || status === 'running' || status === 'critical')) {
      opacity.value = withRepeat(withTiming(0.35, { duration: 900 }), -1, true);
    } else {
      opacity.value = 1;
    }
  }, [status, pulse]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getColorConfig = () => {
    switch (status) {
      case 'online':
      case 'running':
        return {
          dot: '#10B981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)',
          text: '#34D399',
          defaultLabel: 'ONLINE',
        };
      case 'warning':
        return {
          dot: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
          text: '#FBBF24',
          defaultLabel: 'WARNING',
        };
      case 'critical':
        return {
          dot: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.35)',
          text: '#F87171',
          defaultLabel: 'CRITICAL',
        };
      case 'offline':
      case 'idle':
      default:
        return {
          dot: '#64748B',
          bg: 'rgba(100, 116, 139, 0.12)',
          border: 'rgba(100, 116, 139, 0.25)',
          text: '#94A3B8',
          defaultLabel: 'OFFLINE',
        };
    }
  };

  const config = getColorConfig();
  const displayLabel = label || config.defaultLabel;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: config.dot,
            width: isSmall ? 6 : 7,
            height: isSmall ? 6 : 7,
            borderRadius: isSmall ? 3 : 3.5,
          },
          animatedDotStyle,
        ]}
      />
      <Text
        style={[
          styles.label,
          {
            color: config.text,
            fontSize: isSmall ? 9 : 10,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    marginRight: 6,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
