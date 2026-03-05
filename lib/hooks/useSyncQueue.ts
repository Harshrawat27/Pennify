import { api } from '@/convex/_generated/api';
import { dequeue, getQueue, incrementRetry } from '@/lib/offlineQueue';
import { usePendingStore } from '@/lib/stores/usePendingStore';
import NetInfo from '@react-native-community/netinfo';
import { useMutation } from 'convex/react';
import { useCallback, useEffect } from 'react';

const MAX_RETRIES = 3;

/**
 * Mount this once at the tab root (CustomTabBar).
 * - On mount: hydrates Zustand from AsyncStorage so pending txs show after app restart
 * - On mount + when network returns: flushes the queue to Convex
 */
export function useSyncQueue() {
  const createTransaction = useMutation(api.transactions.create);
  const { remove: removePending, hydrate, syncTrigger } = usePendingStore();

  // Hydrate in-memory store from persisted queue on app start
  useEffect(() => {
    getQueue().then(hydrate);
  }, [hydrate]);

  const processQueue = useCallback(async () => {
    const queue = await getQueue();
    if (queue.length === 0) return;

    for (const item of queue) {
      if (item.retries >= MAX_RETRIES) continue; // permanently failed, skip

      try {
        await createTransaction({
          userId: item.userId,
          title: item.title,
          amount: item.amount,
          note: item.note,
          date: item.date,
          categoryId: item.categoryId as any,
          accountId: item.accountId as any,
        });
        // Success — remove from queue and pending UI
        await dequeue(item.localId);
        removePending(item.localId);
      } catch {
        // Network or server error — increment retry, keep in queue
        await incrementRetry(item.localId);
      }
    }
  }, [createTransaction, removePending]);

  // Auto-flush when connectivity is (re)established
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void processQueue();
      }
    });
    return unsubscribe;
  }, [processQueue]);

  // Attempt on mount (handles normal online open with stale queue items)
  useEffect(() => {
    void processQueue();
  }, [processQueue]);

  // Immediate flush when add-transaction enqueues a new item (syncTrigger bumped)
  useEffect(() => {
    if (syncTrigger > 0) void processQueue();
  }, [syncTrigger, processQueue]);

  return { processQueue };
}
