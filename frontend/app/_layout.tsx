import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#06B6D4',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: '#1E293B',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Digital Twin',
          tabBarIcon: ({ color, size }) => <Ionicons name="git-network" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="analytics" 
        options={{ 
          title: 'Trends',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="ai-insights" 
        options={{ 
          title: 'AI Diagnostics',
          tabBarIcon: ({ color, size }) => <Ionicons name="hardware-chip" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="alarms" 
        options={{ 
          title: 'Alarms',
          tabBarIcon: ({ color, size }) => <Ionicons name="warning" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="devices" 
        options={{ 
          title: 'Hardware',
          tabBarIcon: ({ color, size }) => <Ionicons name="radio" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: 'Controls',
          tabBarIcon: ({ color, size }) => <Ionicons name="options" size={size} color={color} />
        }} 
      />
    </Tabs>
  );
}