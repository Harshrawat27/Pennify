import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import {
  getCachedParentCategories,
  setCachedParentCategories,
  type CachedParentCategory,
} from '@/lib/localCache';
import { useConvexAuth, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

/**
 * Returns all parent categories.
 * - Reads from AsyncStorage cache immediately
 * - Convex query runs in background and writes through to cache when resolved
 */
export function useCachedParentCategories(): CachedParentCategory[] {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const { isAuthenticated } = useConvexAuth();

  const [parentCategories, setParentCategories] = useState<CachedParentCategory[]>([]);

  useEffect(() => {
    getCachedParentCategories().then((cached) => {
      if (cached.length > 0) setParentCategories(cached);
    });
  }, []);

  const convexParents = useQuery(api.parentCategories.list, userId && isAuthenticated ? { userId } : 'skip');

  useEffect(() => {
    if (convexParents === undefined) return;
    const all = convexParents as unknown as CachedParentCategory[];
    void setCachedParentCategories(all);
    setParentCategories(all);
  }, [convexParents]);

  return parentCategories;
}
