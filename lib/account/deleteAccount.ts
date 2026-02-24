import { authClient } from '../auth-client';
import { convex } from '../convex';
import { api } from '../../convex/_generated/api';

/**
 * Deletes the user's account completely:
 * 1. Delete all user data from Convex cloud
 * 2. Delete the Better Auth user account
 * 3. Sign out locally
 */
export async function deleteAccount(userId: string): Promise<void> {
  console.log('[deleteAccount] Starting for userId:', userId);

  // 1. Delete all app data from Convex
  await convex.mutation(api.sync.deleteUserData, { userId });
  console.log('[deleteAccount] Step 1 done: Convex data deleted');

  // 2. Delete the Better Auth user (sessions, auth accounts, user record)
  await (authClient as any).deleteUser();
  console.log('[deleteAccount] Step 2 done: Better Auth user deleted');

  // 3. Sign out locally (clears secure store tokens)
  await authClient.signOut();
  console.log('[deleteAccount] Step 3 done: signed out — account fully deleted');
}
