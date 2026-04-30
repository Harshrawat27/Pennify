import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { getLocalSubscriptionStatus, setLocalSubscriptionStatus } from '@/lib/subscription';
import { useConvexAuth, useQuery } from 'convex/react';
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
  const { isAuthenticated } = useConvexAuth();

  // undefined = still reading from SecureStore; null = no subscription
  const [localStatus, setLocalStatus] = useState<string | null | undefined>(undefined);

  const prefs = useQuery(api.preferences.get, userId && isAuthenticated ? { userId } : 'skip');

  // Seed from user-specific cache when userId is known.
  // Each user has their own key so a different user on the same device
  // (or a reinstall) gets no stale data — Convex becomes the source of truth.
  useEffect(() => {
    if (!userId) return;
    getLocalSubscriptionStatus(userId).then((cached) => {
      setLocalStatus(cached ?? null);
    });
  }, [userId]);

  // When Convex resolves, write through to user-specific cache and update state
  useEffect(() => {
    if (prefs === undefined) return; // still loading
    if (!userId) return;
    const status = prefs?.subscriptionStatus ?? null;
    setLocalStatus(status);
    void setLocalSubscriptionStatus(userId, status);
  }, [userId, prefs?.subscriptionStatus]);

  const isPremium = localStatus === 'monthly' || localStatus === 'yearly';
  const isLoading = localStatus === undefined;

  return { isPremium, status: localStatus, isLoading };
}
