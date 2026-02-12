import { getDatabase } from '../db/client';
import { generateId } from '../utils/id';
import type { Category } from '../models/types';

export function getAllCategories(): Category[] {
  const db = getDatabase();
  return db.getAllSync<Category>('SELECT * FROM categories ORDER BY type, name');
}

export function getCategoriesByType(type: 'expense' | 'income'): Category[] {
  const db = getDatabase();
  return db.getAllSync<Category>('SELECT * FROM categories WHERE type = ? ORDER BY name', type);
}

export function getCategoryById(id: string): Category | null {
  const db = getDatabase();
  return db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?', id);
}

export function createCategory(data: Pick<Category, 'name' | 'icon' | 'type' | 'color'>): Category {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO categories (id, name, icon, type, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, data.name, data.icon, data.type, data.color, now, now
  );
  return getCategoryById(id)!;
}
