import { useEffect, useRef } from "react";
import { authClient } from "../auth-client";
import { convex } from "../convex";
import { useTransactionStore } from "../stores/useTransactionStore";
import { useBudgetStore } from "../stores/useBudgetStore";
import { useGoalStore } from "../stores/useGoalStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { SyncEngine } from "./engine";

export function useSyncEngine() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
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
        const pulled = await engine.pullFromCloud();
        if (pulled) {
          useTransactionStore.getState().load();
          useBudgetStore.getState().load();
          useGoalStore.getState().load();
          useSettingsStore.getState().load();
        }
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
