import { authClient } from '@/lib/auth-client';
import { ConvexAuthSetup } from '@/lib/auth/ConvexAuthSetup';
import { useDatabase } from '@/lib/hooks/useDatabase';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { useSyncEngine } from '@/lib/sync/useSyncEngine';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import '../global.css';

function SyncManager() {
  const { data: session } = authClient.useSession();
  // Only activate sync when signed in — but always mounted so tree never changes
  useSyncEngine({ enabled: !!session });
  return null;
}

function RootLayoutNav() {
  const { data: session, isPending } = authClient.useSession();
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);
  const hasRouted = useRef(false);

  // One-time initial route — decide where to go when app starts, then never again.
  useEffect(() => {
    if (isPending) return;
    if (hasRouted.current) return;
    hasRouted.current = true;

    if (!hasOnboarded) {
      router.replace('/onboarding');
    } else if (hasOnboarded === 'pending_auth' && !session) {
      router.replace('/sign-in?fromOnboarding=true');
    } else if (hasOnboarded === 'pending_auth' && session) {
      router.replace('/post-auth-setup');
    } else if (hasOnboarded === 'true' && !session) {
      router.replace('/sign-in');
    } else if (hasOnboarded === 'true' && session) {
      router.replace('/(tabs)');
    }
  }, [hasOnboarded, session, isPending]);

  const statusStyle = !hasOnboarded || !session ? 'light' : 'dark';

  // Always render the Stack — never swap it for a spinner.
  // This prevents onboarding (and all screens) from unmounting when isPending flickers.
  return (
    <>
      <SyncManager />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='onboarding' />
        <Stack.Screen name='sign-in' />
        <Stack.Screen name='post-auth-setup' />
        <Stack.Screen name='(tabs)' />
        <Stack.Screen
          name='add-transaction'
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name='add-budget' options={{ presentation: 'modal' }} />
        <Stack.Screen name='add-goal' options={{ presentation: 'modal' }} />
        <Stack.Screen
          name='currency-picker'
          options={{ presentation: 'modal' }}
        />
      </Stack>
      <StatusBar style={statusStyle} />
    </>
  );
}

export default function RootLayout() {
  const isReady = useDatabase();

  if (!isReady) {
    return (
      <View className='flex-1 bg-black items-center justify-center'>
        <ActivityIndicator color='#fff' size='large' />
      </View>
    );
  }

  return (
    <ConvexAuthSetup>
      <RootLayoutNav />
    </ConvexAuthSetup>
  );
}
