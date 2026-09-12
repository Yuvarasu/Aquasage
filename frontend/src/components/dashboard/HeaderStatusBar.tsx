import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { Ionicons } from '@expo/vector-icons';

export const HeaderStatusBar: React.FC = () => {
  const { isConnected } = useTelemetryStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View className="bg-slate-900/90 border-b border-slate-800/80 px-4 pt-12 pb-3.5 flex-row justify-between items-center backdrop-blur-xl">
      <View>
        <View className="flex-row items-center space-x-1.5">
          <Ionicons name="water" size={16} color="#06b6d4" />
          <Text className="text-white font-black text-base tracking-widest uppercase">AQUASAGE</Text>
        </View>
        <Text className="text-slate-400 text-[11px] font-mono mt-0.5">
          {time.toLocaleDateString()} • {time.toLocaleTimeString()}
        </Text>
      </View>

      <View className="flex-row items-center space-x-2">
        <View className="bg-slate-800/90 border border-slate-700/60 rounded-full px-3 py-1.5 flex-row items-center space-x-2 shadow-inner">
          <View className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-emerald-500/50 shadow-sm' : 'bg-red-500'}`} />
          <Text className="text-slate-200 text-[11px] font-bold tracking-wide">
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
      </View>
    </View>
  );
};