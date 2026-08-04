import React from 'react';
import { View, Text } from 'react-native';

export default function TabScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#071426', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>Module Active</Text>
    </View>
  );
}