import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#06B6D4',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Digital Twin' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Trends' }} />
      <Tabs.Screen name="ai-insights" options={{ title: 'AI Diagnostics' }} />
      <Tabs.Screen name="alarms" options={{ title: 'Alarms' }} />
      <Tabs.Screen name="devices" options={{ title: 'Hardware' }} />
      <Tabs.Screen name="settings" options={{ title: 'Controls' }} />
    </Tabs>
  );
}