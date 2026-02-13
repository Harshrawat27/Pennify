import { getDatabase } from '../db/client';
import { generateId } from '../utils/id';
import { getSpentByCategory } from './transactions';
import type { Budget, BudgetWithCategory } from '../models/types';

export function getBudgetsByMonth(month: string): BudgetWithCategory[] {
  const db = getDatabase();
  const budgets = db.getAllSync<Budget & { category_name: string; category_icon: string }>(
    `SELECT b.*, c.name as category_name, c.icon as category_icon
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.month = ? AND b.deleted = 0
     ORDER BY c.name`,
    month
  );

  return budgets.map((b) => ({
    ...b,
    category_icon: b.category_icon as BudgetWithCategory['category_icon'],
    spent: getSpentByCategory(b.category_id, month),
  }));
}

export function createBudget(data: Pick<Budget, 'category_id' | 'limit_amount' | 'month'>): Budget {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO budgets (id, category_id, limit_amount, month, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, 0, 0)',
    id, data.category_id, data.limit_amount, data.month, now, now
  );
  return db.getFirstSync<Budget>('SELECT * FROM budgets WHERE id = ?', id)!;
}

export function updateBudget(id: string, data: Partial<Pick<Budget, 'limit_amount'>>): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  if (data.limit_amount !== undefined) {
    db.runSync('UPDATE budgets SET limit_amount = ?, updated_at = ?, synced = 0 WHERE id = ?', data.limit_amount, now, id);
  }
}

export function deleteBudget(id: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync('UPDATE budgets SET deleted = 1, synced = 0, updated_at = ? WHERE id = ?', now, id);
}
