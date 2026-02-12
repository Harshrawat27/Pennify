import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useDatabase } from '@/lib/hooks/useDatabase';
import '../global.css';

export default function RootLayout() {
  const isReady = useDatabase();

  if (!isReady) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-budget" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-goal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="currency-picker" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style='dark' />
    </>
  );
}
