import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { ConvexAuthSetup } from '@/lib/auth/ConvexAuthSetup';
import { useQuery } from 'convex/react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import '../global.css';

function RootLayoutNav() {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id;

  // Check Convex for user preferences to determine routing
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');

  const hasRouted = useRef(false);
  const prevUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Reset routing flag when userId changes (e.g. sign-out then sign-in)
    if (prevUserId.current !== userId) {
      console.log('[Layout] userId changed:', prevUserId.current, '→', userId);
      hasRouted.current = false;
      prevUserId.current = userId;
    }

    if (isPending) {
      console.log('[Layout] auth isPending — waiting');
      return;
    }
    if (hasRouted.current) return;

    if (!session) {
      console.log('[Layout] No session → /sign-in');
      hasRouted.current = true;
      router.replace('/sign-in');
      return;
    }

    // Session exists — wait for Convex prefs to load
    if (prefs === undefined) {
      console.log('[Layout] Session exists, prefs loading…');
      return;
    }

    hasRouted.current = true;
    if (prefs === null) {
      console.log('[Layout] No prefs (new user) → /onboarding');
      router.replace('/onboarding');
    } else {
      console.log('[Layout] Has prefs (returning user) → /(tabs)');
      router.replace('/(tabs)');
    }
  }, [session, isPending, prefs, userId]);

  const statusStyle = !session ? 'light' : 'dark';

  // Show loading overlay ON TOP of the Stack (never unmount the Stack)
  // This is critical — Expo Router needs the Stack always mounted for OAuth
  // redirects and deep-link handling to work correctly.
  const showOverlay = isPending || (!!session && prefs === undefined);

  return (
    <>
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
        <Stack.Screen name='month-detail' />
      </Stack>
      <StatusBar style={statusStyle} />

      {/* Full-screen loading overlay — rendered on top, Stack stays mounted */}
      {showOverlay && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color='#fff' size='large' />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <ConvexAuthSetup>
      <RootLayoutNav />
    </ConvexAuthSetup>
  );
}
