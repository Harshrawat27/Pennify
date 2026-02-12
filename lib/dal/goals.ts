import { getDatabase } from '../db/client';
import { generateId } from '../utils/id';
import type { Goal } from '../models/types';

export function getAllGoals(): Goal[] {
  const db = getDatabase();
  return db.getAllSync<Goal>('SELECT * FROM goals ORDER BY created_at DESC');
}

export function getGoalById(id: string): Goal | null {
  const db = getDatabase();
  return db.getFirstSync<Goal>('SELECT * FROM goals WHERE id = ?', id);
}

export function createGoal(data: Pick<Goal, 'name' | 'icon' | 'target' | 'color'>): Goal {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO goals (id, name, icon, target, saved, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    id, data.name, data.icon, data.target, 0, data.color, now, now
  );
  return getGoalById(id)!;
}

export function updateGoalSaved(id: string, saved: number): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync('UPDATE goals SET saved = ?, updated_at = ? WHERE id = ?', saved, now, id);
}

export function deleteGoal(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM goals WHERE id = ?', id);
}
