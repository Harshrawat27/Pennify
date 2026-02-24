import { getDatabase } from '../db/client';
import { generateId } from '../utils/id';
import type { Account } from '../models/types';

export function getAllAccounts(): Account[] {
  const db = getDatabase();
  return db.getAllSync<Account>('SELECT * FROM accounts WHERE deleted = 0 ORDER BY name');
}

export function getAccountById(id: string): Account | null {
  const db = getDatabase();
  return db.getFirstSync<Account>('SELECT * FROM accounts WHERE id = ? AND deleted = 0', id);
}

export function createAccount(data: Pick<Account, 'name' | 'type' | 'balance' | 'icon'>): Account {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO accounts (id, name, type, balance, icon, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)',
    id, data.name, data.type, data.balance, data.icon, now, now
  );
  return getAccountById(id)!;
}

export function updateAccountBalance(id: string, balance: number): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync('UPDATE accounts SET balance = ?, updated_at = ?, synced = 0 WHERE id = ?', balance, now, id);
}

export function deleteAccount(id: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync('UPDATE accounts SET deleted = 1, synced = 0, updated_at = ? WHERE id = ?', now, id);
}

/**
 * Derives total balance from initial account balances + all non-deleted transactions.
 * This is always correct across devices because transactions sync as individual records.
 */
export function getTotalBalance(): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ total: number | null }>(
    `SELECT
       COALESCE(SUM(a.balance), 0) +
       COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.deleted = 0), 0)
     AS total
     FROM accounts a WHERE a.deleted = 0`
  );
  return result?.total ?? 0;
}
