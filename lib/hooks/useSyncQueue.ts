import { api } from '@/convex/_generated/api';
import { dequeue, getQueue, incrementRetry } from '@/lib/offlineQueue';
import { getCachedRules } from '@/lib/localCache';
import { matchRule } from '@/lib/utils/matchRules';
import { usePendingStore } from '@/lib/stores/usePendingStore';
import NetInfo from '@react-native-community/netinfo';
import { useAction, useMutation } from 'convex/react';
import { useCallback, useEffect, useRef } from 'react';

const MAX_RETRIES = 3;

/**
 * Mount this once at the tab root (CustomTabBar).
 * - On mount: hydrates Zustand from AsyncStorage so pending txs show after app restart
 * - On mount + when network returns: flushes the queue to Convex
 * - After sync: fires bulk OpenAI categorization in background
 */
export function useSyncQueue() {
  const createTransaction = useMutation(api.transactions.create);
  const categorize = useAction(api.categorize.categorizeTransactions);
  const { remove: removePending, hydrate, syncTrigger } = usePendingStore();
  const isProcessingRef = useRef(false);

  // Hydrate in-memory store from persisted queue on app start
  useEffect(() => {
    getQueue().then(hydrate);
  }, [hydrate]);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    try {
    const queue = await getQueue();
    console.log('[SyncQueue] processQueue called, queue length:', queue.length, 'items:', queue.map(q => q.title));
    if (queue.length === 0) return;

    const synced: Array<{ id: string; title: string; userId: string; isExpense: boolean }> = [];

    // Load rules once for the whole batch
    const cachedRules = await getCachedRules();

    for (const item of queue) {
      if (item.retries >= MAX_RETRIES) continue;

      try {
        const matchedRule = matchRule(item.title, cachedRules);
        console.log('[SyncQueue] creating transaction:', item.title, matchedRule ? `→ rule: ${matchedRule.keyword}` : '→ AI');
        const id = await createTransaction({
          userId: item.userId,
          title: item.title,
          amount: item.amount,
          note: item.note,
          date: item.date,
          accountId: item.accountId as any,
          categoryId: matchedRule ? (matchedRule.categoryId as any) : undefined,
          receiptUrl: item.receiptUrl,
          isBookmarked: item.isBookmarked,
        });
        console.log('[SyncQueue] created OK:', item.title, '→ convexId:', id);
        // Only send to AI if no rule matched
        if (!matchedRule) {
          synced.push({ id: id as string, title: item.title, userId: item.userId, isExpense: item.amount < 0 });
        }
        await dequeue(item.localId);
        removePending(item.localId);
      } catch (e) {
        console.log('[SyncQueue] create FAILED:', item.title, e);
        await incrementRetry(item.localId);
      }
    }

    console.log('[SyncQueue] synced batch:', synced.map(s => `${s.title}→${s.id}`));
    // Fire-and-forget: bulk categorize only rule-unmatched transactions via OpenAI
    if (synced.length > 0) {
      const userId = synced[0].userId;
      console.log('[SyncQueue] calling categorize with', synced.length, 'items');
      void categorize({
        userId,
        transactions: synced.map(({ id, title, isExpense }) => ({ id, title, isExpense })),
      }).then(() => console.log('[SyncQueue] categorize done'))
        .catch((e) => console.log('[SyncQueue] categorize FAILED:', e));
    }
    } finally {
      isProcessingRef.current = false;
    }
  }, [createTransaction, categorize, removePending]);

  // Auto-flush when connectivity is (re)established
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log('[SyncQueue] NetInfo event:', state.isConnected, state.isInternetReachable);
      if (state.isConnected && state.isInternetReachable === true) {
        void processQueue();
      }
    });
    return unsubscribe;
  }, [processQueue]);

  // Attempt on mount (handles normal online open with stale queue items)
  useEffect(() => {
    console.log('[SyncQueue] mount effect → processQueue');
    void processQueue();
  }, [processQueue]);

  // Immediate flush when add-transaction enqueues a new item (syncTrigger bumped)
  useEffect(() => {
    if (syncTrigger > 0) void processQueue();
  }, [syncTrigger, processQueue]);

  return { processQueue };
}
