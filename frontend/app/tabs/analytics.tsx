import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TrendingUp, BarChart3, Droplets, RefreshCw } from 'lucide-react-native';
import { ApiService } from '../../src/services/apiService';

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    const data = await ApiService.fetchConsumptionAnalytics('daily');
    if (data) {
      setAnalytics(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#071426' }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#071426', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 2 }}>WATER ANALYTICS</Text>
          <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
            Consumption Trends & Demand Forecasting
          </Text>
        </View>

        <TouchableOpacity onPress={loadAnalytics} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#10233A', borderWidth: 1, borderColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={16} color="#00C2FF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* --- HERO METRICS CARD --- */}
        <View style={{ backgroundColor: '#10233A', borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.2)', borderRadius: 20, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Droplets size={18} color="#00C2FF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>Daily Village Consumption</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ color: '#00C2FF', fontSize: 9, fontWeight: 'bold' }}>7-DAY WINDOW</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 28, fontFamily: 'monospace' }}>
              {analytics ? analytics.total_consumption_liters.toLocaleString() : '124,150'}
            </Text>
            <Text style={{ color: '#00C2FF', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>LITERS</Text>
          </View>
          <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>
            Average daily distribution: {analytics ? analytics.average_daily_liters.toLocaleString() : '17,735'} Liters
          </Text>
        </View>

        {/* --- CONSUMPTION BREAKDOWN CHART REPLACEMENT --- */}
        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4 }}>
          Daily Volume Breakdown
        </Text>

        {loading ? (
          <ActivityIndicator color="#00C2FF" style={{ marginTop: 10 }} />
        ) : analytics && analytics.data ? (
          analytics.data.map((item: any, idx: number) => (
            <View key={idx} style={{ backgroundColor: '#10233A', borderWidth: 1, borderColor: '#1E293B', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>{item.date}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'monospace', marginTop: 2 }}>Avg Flow: {item.avg_flow_lmin} L/min</Text>
              </View>
              <Text style={{ color: '#38BDF8', fontWeight: '900', fontSize: 16, fontFamily: 'monospace' }}>
                {item.consumption_liters.toLocaleString()} L
              </Text>
            </View>
          ))
        ) : (
          <View style={{ backgroundColor: '#10233A', borderRadius: 14, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8', fontSize: 12 }}>Analytics data loading...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}