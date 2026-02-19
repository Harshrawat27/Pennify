import { getDatabase } from '../db/client';
import { generateId } from '../utils/id';
import type { MonthlyBudget } from '../models/types';

export function getBudgetForMonth(month: string): MonthlyBudget | null {
  const db = getDatabase();
  // Exact match first
  const exact = db.getFirstSync<MonthlyBudget>(
    'SELECT * FROM monthly_budgets WHERE month = ? AND deleted = 0',
    month
  );
  if (exact) return exact;

  // Fallback: most recent budget before this month (inherit previous)
  return db.getFirstSync<MonthlyBudget>(
    'SELECT * FROM monthly_budgets WHERE month < ? AND deleted = 0 ORDER BY month DESC LIMIT 1',
    month
  );
}

export function getAllMonthlyBudgets(): MonthlyBudget[] {
  const db = getDatabase();
  return db.getAllSync<MonthlyBudget>(
    'SELECT * FROM monthly_budgets WHERE deleted = 0 ORDER BY month DESC'
  );
}

export function setMonthlyBudget(month: string, budget: number): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  const existing = db.getFirstSync<MonthlyBudget>(
    'SELECT * FROM monthly_budgets WHERE month = ? AND deleted = 0',
    month
  );

  if (existing) {
    db.runSync(
      'UPDATE monthly_budgets SET budget = ?, updated_at = ?, synced = 0 WHERE id = ?',
      budget, now, existing.id
    );
  } else {
    db.runSync(
      'INSERT INTO monthly_budgets (id, month, budget, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, 0, 0)',
      generateId(), month, budget, now, now
    );
  }
}

export function deleteMonthlyBudget(id: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    'UPDATE monthly_budgets SET deleted = 1, synced = 0, updated_at = ? WHERE id = ?',
    now, id
  );
}
