import { useEffect, useRef } from "react";
import { authClient } from "../auth-client";
import { convex } from "../convex";
import * as dal from "../dal";
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

    // Save email to user_preferences for reference
    const email = session?.user?.email;
    if (email) {
      dal.updatePreference('email', email);
    }

    const engine = new SyncEngine(convex, userId);
    engineRef.current = engine;

    (async () => {
      try {
        const hasOnboarded = useSettingsStore.getState().hasOnboarded;
        const isNewSignIn = hasOnboarded === 'pending_auth';
        const cloudHasData = await engine.pullFromCloud(isNewSignIn);

        if (isNewSignIn && !cloudHasData) {
          // Cloud is empty — fresh/deleted account.
          // Wipe old local data, keep only fresh onboarding data,
          // and mark everything synced=0 so it pushes to cloud.
          engine.resetLocalForFreshAccount();
        }

        // Always reload stores after pull
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
