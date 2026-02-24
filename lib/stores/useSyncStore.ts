import { create } from 'zustand';

interface SyncState {
  isInitialSyncDone: boolean;
  setInitialSyncDone: () => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isInitialSyncDone: false,
  setInitialSyncDone: () => set({ isInitialSyncDone: true }),
  reset: () => set({ isInitialSyncDone: false }),
}));
