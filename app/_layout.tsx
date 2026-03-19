import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { ConvexAuthSetup } from '@/lib/auth/ConvexAuthSetup';
import { initializePurchases } from '@/lib/revenuecat';
import { useQuery } from 'convex/react';
import { Stack, router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const splashHidden = useRef(false);
  // prevSubStatus tracks changes after initial routing to re-route on purchase

  // Hide splash as soon as auth state is known (only once)
  useEffect(() => {
    if (!isPending && !splashHidden.current) {
      // if (
      //   !isPending &&
      //   (prefs !== undefined || !session) &&
      //   !splashHidden.current
      // ) {
      splashHidden.current = true;
      SplashScreen.hideAsync();
    }
  }, [isPending]);

  // Re-route to tabs when subscription is activated (e.g. after RevenueCat purchase on paywall)
  useEffect(() => {
    if (!hasRouted.current) return;
    const status = prefs?.subscriptionStatus;
    if (status === prevSubStatus.current) return;
    prevSubStatus.current = status;
    if (status === 'monthly' || status === 'yearly') {
      router.replace('/(tabs)');
    }
    // Expiry is handled silently — user stays in tabs but + button shows paywall
  }, [prefs?.subscriptionStatus]);

  // Initialize RevenueCat as soon as we have a userId
  useEffect(() => {
    if (userId) initializePurchases(userId);
  }, [userId]);

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
      console.log('[Layout] No prefs (new user) → /welcome');
      router.replace('/welcome');
      return;
    }

    // Only navigate to tabs if we're still on an auth screen.
    // If the user already navigated somewhere (another tab, a modal, etc.)
    // during the prefs-loading window, leave them there.
    const isOnAuthScreen =
      pathname === '/sign-in' ||
      pathname === '/welcome' ||
      pathname === '/onboarding' ||
      pathname === '/post-auth-setup' ||
      pathname === '/paywall';

    if (isOnAuthScreen) {
      console.log('[Layout] Has prefs → /(tabs)');
      router.replace('/(tabs)');
    } else {
      console.log('[Layout] Has prefs, already in app → skip replace');
    }
  }, [session, isPending, prefs, userId]);

  const pathname = usePathname();
  const isHome = pathname === '/';
  const isWelcome = pathname === '/welcome';
  const isSignIn = pathname === '/sign-in';
  const isPaywall = pathname === '/paywall';
  const statusBarAreaBg =
    isHome || isWelcome || isSignIn ? 'black' : '#fff';
  const statusStyle =
    isHome || isWelcome || isSignIn || !session ? 'light' : 'dark';

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: statusBarAreaBg }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fafafa' },
        }}
      >
        <Stack.Screen name='welcome' />
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
        <Stack.Screen name='accounts' />
        <Stack.Screen
          name='transaction-detail'
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name='subscriptions' />
        <Stack.Screen name='categories' />
        <Stack.Screen name='monthly-budget' />
        <Stack.Screen name='bookmarks' />
        <Stack.Screen name='smart-rules' />
        <Stack.Screen name='finance-chat' options={{ headerShown: false }} />
        <Stack.Screen name='people' />
        <Stack.Screen name='person-detail' />
      </Stack>
      <StatusBar style={statusStyle} />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <ConvexAuthSetup>
      <RootLayoutNav />
    </ConvexAuthSetup>
  );
}
