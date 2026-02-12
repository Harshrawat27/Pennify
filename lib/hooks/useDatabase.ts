import { useEffect, useState } from 'react';
import { runMigrations } from '../db/migrations';
import { seedDatabase } from '../db/seed';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useGoalStore } from '../stores/useGoalStore';
import { useSettingsStore } from '../stores/useSettingsStore';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      runMigrations();
      seedDatabase();

      // Load initial data into stores
      useTransactionStore.getState().load();
      useBudgetStore.getState().load();
      useGoalStore.getState().load();
      useSettingsStore.getState().load();

      setIsReady(true);
    } catch (e) {
      console.error('Database initialization failed:', e);
    }
  }, []);

  return isReady;
}
