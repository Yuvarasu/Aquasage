import { Tabs } from 'expo-router';
import React from 'react';
import { Layers, BarChart3, Bot, Bell, Radio, Sliders } from 'lucide-react-native';
import { useAlertStore } from '../../src/store/useAlertStore';
import { hapticsService } from '../../src/services/hapticsService';

export default function TabLayout() {
  const { alarms } = useAlertStore();
  const unacknowledgedCount = alarms.filter((a) => !a.acknowledged).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00C2FF',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#071426',
          borderTopColor: 'rgba(30, 41, 59, 0.8)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: 'bold',
          letterSpacing: 0.3,
        },
      }}
      screenListeners={{
        tabPress: () => {
          hapticsService.tapLight();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Digital Twin',
          tabBarIcon: ({ color, size }) => <Layers color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="ai-insights"
        options={{
          title: 'AI Insights',
          tabBarIcon: ({ color, size }) => <Bot color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="alarms"
        options={{
          title: 'Alarms',
          tabBarBadge: unacknowledgedCount > 0 ? unacknowledgedCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: '900',
          },
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Hardware',
          tabBarIcon: ({ color, size }) => <Radio color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Sliders color={color} size={size - 2} />,
        }}
      />
    </Tabs>
  );
}