import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { getLocalSubscriptionStatus, setLocalSubscriptionStatus } from '@/lib/subscription';
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

/**
 * Returns subscription status from local SecureStore cache immediately,
 * then syncs from Convex in the background and updates both cache and state.
 *
 * isLoading = true only for the brief moment before SecureStore responds.
 * On a new device the cache is empty, so Convex becomes the source of truth
 * and the result is saved to cache for future offline/fast reads.
 */
export function useSubscription() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // undefined = still reading from SecureStore; null = no subscription
  const [localStatus, setLocalStatus] = useState<string | null | undefined>(undefined);

  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');

  // Seed from local cache on mount (instant on returning opens)
  useEffect(() => {
    getLocalSubscriptionStatus().then((cached) => {
      setLocalStatus(cached ?? null);
    });
  }, []);

  // When Convex resolves, write through to cache and update state
  useEffect(() => {
    if (prefs === undefined) return; // still loading
    const status = prefs?.subscriptionStatus ?? null;
    setLocalStatus(status);
    void setLocalSubscriptionStatus(status);
  }, [prefs?.subscriptionStatus]);

  const isPremium = localStatus === 'monthly' || localStatus === 'yearly';
  const isLoading = localStatus === undefined;

  return { isPremium, status: localStatus, isLoading };
}
