import { getDatabase } from '../db/client';

export function getSetting(key: string): string | null {
  const db = getDatabase();
  const row = db.getFirstSync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT OR REPLACE INTO settings (key, value, synced, updated_at) VALUES (?, ?, 0, ?)',
    key,
    value,
    now
  );
}
