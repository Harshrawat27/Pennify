import { authClient } from '../auth-client';
import { convex } from '../convex';
import { api } from '../../convex/_generated/api';
import { getDatabase } from '../db/client';
import { seedDatabase } from '../db/seed';
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
  console.log('[deleteAccount] Starting for userId:', userId);

  // 1. Delete all app data from Convex (accounts, categories, transactions, etc.)
  await convex.mutation(api.sync.deleteUserData, { userId });
  console.log('[deleteAccount] Step 1 done: Convex data deleted');

  // 2. Delete the Better Auth user (sessions, auth accounts, user record)
  await (authClient as any).deleteUser();
  console.log('[deleteAccount] Step 2 done: Better Auth user deleted');

  // 3. Wipe all local SQLite data
  const db = getDatabase();
  db.execSync('DELETE FROM transactions');
  db.execSync('DELETE FROM budgets');
  db.execSync('DELETE FROM goals');
  db.execSync('DELETE FROM accounts');
  db.execSync('DELETE FROM categories');
  db.execSync('DELETE FROM settings');
  db.execSync('DELETE FROM user_preferences');
  db.execSync('DELETE FROM monthly_budgets');
  console.log('[deleteAccount] Step 3 done: SQLite wiped');

  // 4. Re-seed the user_preferences row so updatePreference() works in this session
  seedDatabase();
  console.log('[deleteAccount] Step 4 done: user_preferences row re-seeded');

  // 5. Reset all Zustand stores so in-memory state matches wiped DB
  useSettingsStore.getState().load();
  useTransactionStore.getState().load();
  useBudgetStore.getState().load();
  useGoalStore.getState().load();
  console.log('[deleteAccount] Step 5 done: Zustand stores reset, hasOnboarded:', useSettingsStore.getState().hasOnboarded);

  // 6. Sign out locally (clears secure store tokens)
  await authClient.signOut();
  console.log('[deleteAccount] Step 6 done: signed out — account fully deleted');
}
