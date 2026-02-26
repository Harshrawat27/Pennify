import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { ConvexAuthSetup } from '@/lib/auth/ConvexAuthSetup';
import { useQuery } from 'convex/react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import '../global.css';

// Keep the splash screen visible until we manually hide it
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id;

  // Check Convex for user preferences to determine routing
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');

  const hasRouted = useRef(false);
  const prevUserId = useRef<string | undefined>(undefined);
  const prevSubStatus = useRef<string | undefined>(undefined);

  // Hide splash as soon as auth state is known
  useEffect(() => {
    if (!isPending) {
      SplashScreen.hideAsync();
    }
  }, [isPending]);

  // Re-route instantly when subscription status changes (e.g. after RevenueCat purchase)
  useEffect(() => {
    if (!hasRouted.current) return;
    const status = prefs?.subscriptionStatus;
    if (status === prevSubStatus.current) return;
    prevSubStatus.current = status;
    const isPremium = status === 'monthly' || status === 'yearly';
    if (isPremium) {
      router.replace('/(tabs)');
    } else if (status === 'expired' || status === 'none') {
      router.replace('/paywall');
    }
  }, [prefs?.subscriptionStatus]);

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
      return;
    }

    const isPremium =
      prefs.subscriptionStatus === 'monthly' ||
      prefs.subscriptionStatus === 'yearly';

    if (isPremium) {
      console.log('[Layout] Premium user → /(tabs)');
      router.replace('/(tabs)');
    } else {
      console.log('[Layout] No subscription → /paywall');
      router.replace('/paywall');
    }
  }, [session, isPending, prefs, userId]);

  const statusStyle = !session ? 'light' : 'dark';

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='onboarding' />
        <Stack.Screen name='paywall' />
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
