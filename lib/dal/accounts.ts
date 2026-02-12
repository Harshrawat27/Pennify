import { getDatabase } from '../db/client';
import { generateId } from '../utils/id';
import type { Account } from '../models/types';

export function getAllAccounts(): Account[] {
  const db = getDatabase();
  return db.getAllSync<Account>('SELECT * FROM accounts ORDER BY name');
}

export function getAccountById(id: string): Account | null {
  const db = getDatabase();
  return db.getFirstSync<Account>('SELECT * FROM accounts WHERE id = ?', id);
}

export function createAccount(data: Pick<Account, 'name' | 'type' | 'balance' | 'icon'>): Account {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO accounts (id, name, type, balance, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, data.name, data.type, data.balance, data.icon, now, now
  );
  return getAccountById(id)!;
}

export function updateAccountBalance(id: string, balance: number): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync('UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?', balance, now, id);
}
