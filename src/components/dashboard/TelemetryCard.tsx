import React from 'react';
import { View, Text } from 'react-native';

interface CardProps {
  title: string;
  value: string | number;
  unit: string;
  subtitle?: string;
  statusColor?: string; // 'emerald' | 'amber' | 'rose' | 'cyan'
}

export const TelemetryCard: React.FC<CardProps> = ({
  title,
  value,
  unit,
  subtitle,
  statusColor = 'emerald',
}) => {
  const borderMap: Record<string, string> = {
    emerald: 'border-emerald-500/20 bg-slate-900/80 shadow-emerald-950/20',
    amber: 'border-amber-500/20 bg-slate-900/80 shadow-amber-950/20',
    rose: 'border-rose-500/20 bg-slate-900/80 shadow-rose-950/20',
    cyan: 'border-cyan-500/20 bg-slate-900/80 shadow-cyan-950/20',
  };

  const textAccentMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    cyan: 'text-cyan-400',
  };

  return (
    <View className={`border rounded-2xl p-4 my-1.5 shadow-xl w-[48%] backdrop-blur-md ${borderMap[statusColor]}`}>
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
          {title}
        </Text>
        <View className={`w-2 h-2 rounded-full ${statusColor === 'emerald' ? 'bg-emerald-400' : statusColor === 'amber' ? 'bg-amber-400' : statusColor === 'rose' ? 'bg-rose-400' : 'bg-cyan-400'} shadow-sm`} />
      </View>
      <View className="flex-row items-baseline space-x-1.5">
        <Text className="text-white font-black text-2xl font-mono tracking-tight">{value}</Text>
        <Text className={`text-xs font-extrabold ${textAccentMap[statusColor]}`}>{unit}</Text>
      </View>
      {subtitle && (
        <Text className="text-slate-500 text-[10px] font-medium mt-1.5" numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};