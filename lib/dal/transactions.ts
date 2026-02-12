import { getDatabase } from '../db/client';
import { generateId } from '../utils/id';
import type { Transaction, TransactionWithCategory, CategoryBreakdown, DailySpending } from '../models/types';

export function getTransactionsByMonth(month: string): TransactionWithCategory[] {
  const db = getDatabase();
  return db.getAllSync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.date LIKE ? || '%'
     ORDER BY t.date DESC, t.created_at DESC`,
    month
  );
}

export function getTransactionsByDate(date: string): TransactionWithCategory[] {
  const db = getDatabase();
  return db.getAllSync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.date = ?
     ORDER BY t.created_at DESC`,
    date
  );
}

export function createTransaction(data: Pick<Transaction, 'title' | 'amount' | 'note' | 'date' | 'category_id' | 'account_id'>): Transaction {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO transactions (id, title, amount, note, date, category_id, account_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id, data.title, data.amount, data.note || '', data.date, data.category_id, data.account_id, now, now
  );
  return db.getFirstSync<Transaction>('SELECT * FROM transactions WHERE id = ?', id)!;
}

export function deleteTransaction(id: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync('UPDATE transactions SET updated_at = ? WHERE id = ?', now, id);
  db.runSync('DELETE FROM transactions WHERE id = ?', id);
}

export function getMonthlyIncome(month: string): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ total: number | null }>(
    `SELECT SUM(amount) as total FROM transactions WHERE amount > 0 AND date LIKE ? || '%'`,
    month
  );
  return result?.total ?? 0;
}

export function getMonthlyExpenses(month: string): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ total: number | null }>(
    `SELECT SUM(ABS(amount)) as total FROM transactions WHERE amount < 0 AND date LIKE ? || '%'`,
    month
  );
  return result?.total ?? 0;
}

export function getCategoryBreakdown(month: string): CategoryBreakdown[] {
  const db = getDatabase();
  const rows = db.getAllSync<{ name: string; icon: string; amount: number }>(
    `SELECT c.name, c.icon, SUM(ABS(t.amount)) as amount
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.amount < 0 AND t.date LIKE ? || '%'
     GROUP BY c.id
     ORDER BY amount DESC`,
    month
  );

  const total = rows.reduce((s, r) => s + r.amount, 0);
  return rows.map((r) => ({
    name: r.name,
    icon: r.icon as CategoryBreakdown['icon'],
    amount: r.amount,
    percent: total > 0 ? Math.round((r.amount / total) * 100) : 0,
  }));
}

export function getDailySpending(month: string): DailySpending[] {
  const db = getDatabase();
  return db.getAllSync<DailySpending>(
    `SELECT date as day, SUM(ABS(amount)) as amount
     FROM transactions
     WHERE amount < 0 AND date LIKE ? || '%'
     GROUP BY date
     ORDER BY date`,
    month
  );
}

export function getSpentByCategory(categoryId: string, month: string): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ total: number | null }>(
    `SELECT SUM(ABS(amount)) as total FROM transactions WHERE amount < 0 AND category_id = ? AND date LIKE ? || '%'`,
    categoryId, month
  );
  return result?.total ?? 0;
}
