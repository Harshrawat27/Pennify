import { getDatabase } from './client';
import { generateId } from '../utils/id';

export function seedDatabase(): void {
  const db = getDatabase();

  // Seed default user_preferences row if none exists
  const prefCount = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM user_preferences');
  if (!prefCount || prefCount.c === 0) {
    const now = new Date().toISOString();
    db.runSync(
      'INSERT INTO user_preferences (id, email, currency, overall_balance, track_income, notifications_enabled, daily_reminder, weekly_report, sync_enabled, has_onboarded, created_at, updated_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
      generateId(), '', 'INR', 0, 1, 1, 1, 1, 1, null, now, now
    );
  }

  // Only seed categories if none exist
  const count = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM categories');
  if (count && count.c > 0) return;

  const now = new Date().toISOString();

  const categories = [
    { id: generateId(), name: 'Food & Dining', icon: 'shopping-bag', type: 'expense', color: '#000000' },
    { id: generateId(), name: 'Transport', icon: 'navigation', type: 'expense', color: '#525252' },
    { id: generateId(), name: 'Entertainment', icon: 'play-circle', type: 'expense', color: '#737373' },
    { id: generateId(), name: 'Shopping', icon: 'shopping-cart', type: 'expense', color: '#A3A3A3' },
    { id: generateId(), name: 'Bills & Utilities', icon: 'zap', type: 'expense', color: '#404040' },
    { id: generateId(), name: 'Salary', icon: 'briefcase', type: 'income', color: '#059669' },
    { id: generateId(), name: 'Freelance', icon: 'briefcase', type: 'income', color: '#10B981' },
    { id: generateId(), name: 'Other', icon: 'more-horizontal', type: 'expense', color: '#D4D4D4' },
  ];

  for (const cat of categories) {
    db.runSync(
      'INSERT INTO categories (id, name, icon, type, color, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)',
      cat.id, cat.name, cat.icon, cat.type, cat.color, now, now
    );
  }
}
