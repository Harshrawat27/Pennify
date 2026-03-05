import type { QueuedTransaction } from '@/lib/offlineQueue';
import { create } from 'zustand';

interface PendingStore {
  transactions: QueuedTransaction[];
  /** Incremented every time a new item is added — useSyncQueue watches this to trigger immediate flush */
  syncTrigger: number;
  add: (tx: QueuedTransaction) => void;
  remove: (localId: string) => void;
  /** Called on app start to hydrate from persisted queue */
  hydrate: (txs: QueuedTransaction[]) => void;
  /** Called after enqueue to ask the background sync to flush now */
  requestSync: () => void;
}

export const usePendingStore = create<PendingStore>((set) => ({
  transactions: [],
  syncTrigger: 0,
  add: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
  remove: (localId) =>
    set((s) => ({ transactions: s.transactions.filter((t) => t.localId !== localId) })),
  hydrate: (txs) => set({ transactions: txs }),
  requestSync: () => set((s) => ({ syncTrigger: s.syncTrigger + 1 })),
}));
