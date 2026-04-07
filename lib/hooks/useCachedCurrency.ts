import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConvexAuth, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

const CURRENCY_CACHE_KEY = 'spendler_currency';
const DEFAULT_CURRENCY = 'USD';

/**
 * Returns the user's preferred currency.
 * - Reads from AsyncStorage instantly (no flash on subsequent opens)
 * - Convex query runs in background and updates cache when resolved
 */
export function useCachedCurrency(): string {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const { isAuthenticated } = useConvexAuth();

  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);

  // Read from cache immediately on mount
  useEffect(() => {
    AsyncStorage.getItem(CURRENCY_CACHE_KEY).then((cached) => {
      if (cached) setCurrency(cached);
    });
  }, []);

  // Convex is source of truth — syncs in background and updates cache
  const prefs = useQuery(api.preferences.get, userId && isAuthenticated ? { userId } : 'skip');

  useEffect(() => {
    if (!prefs?.currency) return;
    setCurrency(prefs.currency);
    void AsyncStorage.setItem(CURRENCY_CACHE_KEY, prefs.currency);
  }, [prefs?.currency]);

  return currency;
}
