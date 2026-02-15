import { authClient } from '../auth-client';
import { convex } from '../convex';
import { getDatabase } from '../db/client';

/**
 * Deletes the user's account completely:
 * 1. Delete all user data from Convex cloud
 * 2. Delete the Better Auth user account
 * 3. Wipe local SQLite data
 * 4. Sign out
 */
export async function deleteAccount(userId: string): Promise<void> {
  // 1. Delete all app data from Convex (accounts, categories, transactions, etc.)
  // Uses string reference since types regenerate from pennifyweb
  await (convex as any).mutation('sync:deleteUserData', { userId });

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

  // 4. Sign out locally (clears secure store tokens)
  await authClient.signOut();
}
