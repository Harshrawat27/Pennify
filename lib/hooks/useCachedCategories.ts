import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import {
  getCachedCategories,
  setCachedCategories,
  type CachedCategory,
} from '@/lib/localCache';
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

/**
 * Returns all categories.
 * - Reads from AsyncStorage cache immediately (zero latency on subsequent opens)
 * - Convex query runs in background and writes through to cache when resolved
 */
export function useCachedCategories(): CachedCategory[] {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const [categories, setCategories] = useState<CachedCategory[]>([]);

  // Seed from local cache on mount
  useEffect(() => {
    getCachedCategories().then((cached) => {
      if (cached.length > 0) setCategories(cached);
    });
  }, []);

  // Convex is source of truth — runs in background, overwrites cache
  const convexCategories = useQuery(api.categories.list, userId ? { userId } : 'skip');

  useEffect(() => {
    if (convexCategories === undefined) return;
    const all = convexCategories as unknown as CachedCategory[];
    void setCachedCategories(all);
    setCategories(all);
  }, [convexCategories]);

  return categories;
}
