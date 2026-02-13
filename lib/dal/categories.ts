import { getDatabase } from '../db/client';
import { generateId } from '../utils/id';
import type { Category } from '../models/types';

export function getAllCategories(): Category[] {
  const db = getDatabase();
  return db.getAllSync<Category>('SELECT * FROM categories WHERE deleted = 0 ORDER BY type, name');
}

export function getCategoriesByType(type: 'expense' | 'income'): Category[] {
  const db = getDatabase();
  return db.getAllSync<Category>('SELECT * FROM categories WHERE type = ? AND deleted = 0 ORDER BY name', type);
}

export function getCategoryById(id: string): Category | null {
  const db = getDatabase();
  return db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ? AND deleted = 0', id);
}

export function createCategory(data: Pick<Category, 'name' | 'icon' | 'type' | 'color'>): Category {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO categories (id, name, icon, type, color, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)',
    id, data.name, data.icon, data.type, data.color, now, now
  );
  return getCategoryById(id)!;
}

export function deleteCategory(id: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync('UPDATE categories SET deleted = 1, synced = 0, updated_at = ? WHERE id = ?', now, id);
}
