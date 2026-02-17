import { useEffect, useRef } from "react";
import { authClient } from "../auth-client";
import { convex } from "../convex";
import { useTransactionStore } from "../stores/useTransactionStore";
import { useBudgetStore } from "../stores/useBudgetStore";
import { useGoalStore } from "../stores/useGoalStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { SyncEngine } from "./engine";

export function useSyncEngine({ enabled = true }: { enabled?: boolean } = {}) {
  const { data: session } = authClient.useSession();
  const userId = enabled ? session?.user?.id : undefined;
  const engineRef = useRef<SyncEngine | null>(null);

  useEffect(() => {
    if (!userId) {
      engineRef.current?.stop();
      engineRef.current = null;
      return;
    }

    const engine = new SyncEngine(convex, userId);
    engineRef.current = engine;

    (async () => {
      try {
        // If user just finished onboarding and is signing in, cloud data
        // should replace local onboarding data (existing account wins)
        const hasOnboarded = useSettingsStore.getState().hasOnboarded;
        const replaceLocal = hasOnboarded === 'pending_auth';
        await engine.pullFromCloud(replaceLocal);
        // Always reload stores — after onboarding, SQLite has data
        // that Zustand doesn't know about yet (commitOnboarding wrote
        // directly via DAL, bypassing store setters)
        useTransactionStore.getState().load();
        useBudgetStore.getState().load();
        useGoalStore.getState().load();
        useSettingsStore.getState().load();
      } catch (e) {
        console.warn("[useSyncEngine] initial pull failed:", e);
      }
      engine.start();
    })();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [userId]);
}
