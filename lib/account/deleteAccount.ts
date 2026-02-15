import { authClient } from '../auth-client';
import { convex } from '../convex';
import { api } from '../../convex/_generated/api';
import { getDatabase } from '../db/client';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useGoalStore } from '../stores/useGoalStore';

/**
 * Deletes the user's account completely:
 * 1. Delete all user data from Convex cloud
 * 2. Delete the Better Auth user account
 * 3. Wipe local SQLite data
 * 4. Reset Zustand stores
 * 5. Sign out
 */
export async function deleteAccount(userId: string): Promise<void> {
  // 1. Delete all app data from Convex (accounts, categories, transactions, etc.)
  await convex.mutation(api.sync.deleteUserData, { userId });

  // 2. Delete the Better Auth user (sessions, auth accounts, user record)
  await (authClient as any).deleteUser();

  // 3. Wipe all local SQLite data
  const db = getDatabase();
  db.execSync('DELETE FROM transactions');
  db.execSync('DELETE FROM budgets');
  db.execSync('DELETE FROM goals');
  db.execSync('DELETE FROM accounts');
  db.execSync('DELETE FROM categories');
  db.execSync('DELETE FROM settings');

  // 4. Reset all Zustand stores so in-memory state matches wiped DB
  useSettingsStore.getState().load();
  useTransactionStore.getState().load();
  useBudgetStore.getState().load();
  useGoalStore.getState().load();

  // 5. Sign out locally (clears secure store tokens)
  await authClient.signOut();
}
