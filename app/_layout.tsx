import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { ConvexAuthSetup } from '@/lib/auth/ConvexAuthSetup';
import { initializePurchases } from '@/lib/revenuecat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useConvexAuth, useQuery } from 'convex/react';
import { Stack, router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

const HAS_LAUNCHED_KEY = 'spendler_has_launched';
const WAS_AUTHENTICATED_KEY = 'spendler_was_authenticated';
const STORED_USER_ID_KEY = 'spendler_user_id';

// Keep the splash screen visible until we manually hide it
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id;
  const { isAuthenticated } = useConvexAuth();

  // Check Convex for user preferences to determine routing
  const prefs = useQuery(api.preferences.get, userId && isAuthenticated ? { userId } : 'skip');

  const hasRouted = useRef(false);
  const prevUserId = useRef<string | undefined>(undefined);
  const prevSubStatus = useRef<string | undefined>(undefined);
  const splashHidden = useRef(false);
  const [hasLaunched, setHasLaunched] = useState<boolean | null>(null);

  // Check if app has been launched before on this device
  useEffect(() => {
    AsyncStorage.getItem(HAS_LAUNCHED_KEY).then((val) => {
      setHasLaunched(val === 'true');
    });
  }, []);
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
  // Also persist userId to AsyncStorage for offline access
  useEffect(() => {
    if (userId) {
      initializePurchases(userId);
      void AsyncStorage.setItem(STORED_USER_ID_KEY, userId);
    }
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
    if (hasLaunched === null) {
      console.log('[Layout] hasLaunched check pending — waiting');
      return;
    }
    if (hasRouted.current) return;

    if (!session) {
      // Check network before deciding — offline + previously authenticated = let them in
      NetInfo.fetch().then((state) => {
        const isOnline = state.isConnected && state.isInternetReachable !== false;
        if (!isOnline) {
          AsyncStorage.getItem(WAS_AUTHENTICATED_KEY).then((wasAuth) => {
            if (wasAuth === 'true') {
              // Known user, offline — route to tabs so offline queue still works
              console.log('[Layout] Offline + was authenticated → /(tabs) offline mode');
              hasRouted.current = true;
              router.replace('/(tabs)');
            } else {
              // Never authenticated, offline — route to sign-in
              hasRouted.current = true;
              console.log('[Layout] Offline + never authenticated → /sign-in');
              router.replace('/sign-in');
            }
          });
        } else {
          hasRouted.current = true;
          if (!hasLaunched) {
            console.log('[Layout] First launch, no session → /welcome');
            AsyncStorage.setItem(HAS_LAUNCHED_KEY, 'true');
            router.replace('/welcome');
          } else {
            console.log('[Layout] Returning user, no session → /sign-in');
            router.replace('/sign-in');
          }
        }
      });
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

    // Mark user as authenticated so offline opens can bypass sign-in
    void AsyncStorage.setItem(WAS_AUTHENTICATED_KEY, 'true');

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
  }, [session, isPending, prefs, userId, hasLaunched]);

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
