import { getDatabase } from '../db/client';
import type { UserPreferences } from '../models/types';

export function getUserPreferences(): UserPreferences | null {
  const db = getDatabase();
  return db.getFirstSync<UserPreferences>('SELECT * FROM user_preferences LIMIT 1');
}

export function updatePreference<K extends keyof Omit<UserPreferences, 'id' | 'created_at' | 'updated_at' | 'synced'>>(
  key: K,
  value: UserPreferences[K]
): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE user_preferences SET ${key} = ?, updated_at = ?, synced = 0`,
    value as string | number,
    now
  );
}
