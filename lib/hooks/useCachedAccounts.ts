import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import {
  getCachedAccounts,
  setCachedAccounts,
  type CachedAccount,
} from '@/lib/localCache';
import { useConvexAuth, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

/**
 * Returns all active accounts.
 * - Reads from AsyncStorage cache immediately (zero latency on subsequent opens)
 * - Convex query runs in background and writes through to cache when resolved
 */
export function useCachedAccounts(): CachedAccount[] {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const { isAuthenticated } = useConvexAuth();

  const [accounts, setAccounts] = useState<CachedAccount[]>([]);

  // Seed from local cache on mount
  useEffect(() => {
    getCachedAccounts().then((cached) => {
      if (cached.length > 0) {
        setAccounts(cached.filter((a) => a.isActive !== false));
      }
    });
  }, []);

  // Convex is source of truth — runs in background, overwrites cache
  const convexAccounts = useQuery(api.accounts.list, userId && isAuthenticated ? { userId } : 'skip');

  useEffect(() => {
    if (convexAccounts === undefined) return;
    const all = convexAccounts as unknown as CachedAccount[];
    void setCachedAccounts(all); // store all (including inactive) for future cache reads
    setAccounts(all.filter((a) => a.isActive !== false));
  }, [convexAccounts]);

  return accounts;
}
