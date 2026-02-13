import { getDatabase } from './client';
import { generateId } from '../utils/id';

export function seedDatabase(): void {
  const db = getDatabase();

  // Seed default settings (idempotent — INSERT OR IGNORE)
  db.runSync(
    "INSERT OR IGNORE INTO settings (key, value, synced, updated_at) VALUES ('currency', 'INR', 0, datetime('now'))"
  );

  // Only seed if no categories exist
  const count = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM categories');
  if (count && count.c > 0) return;

  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // YYYY-MM

  // Seed categories
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

  // Seed default Cash account
  const cashAccountId = generateId();
  db.runSync(
    'INSERT INTO accounts (id, name, type, balance, icon, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)',
    cashAccountId, 'Cash', 'cash', 87457.85, 'credit-card', now, now
  );

  // Seed sample transactions matching the mock data
  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  const transactions = [
    { title: 'Cash, EUR', amount: -354.25, category: 'Other', note: 'Red Card' },
    { title: 'Cafes', amount: -12.49, category: 'Food & Dining', note: '' },
    { title: 'Freelance Pay', amount: 5000, category: 'Freelance', note: 'Bank Transfer' },
    { title: 'Uber Ride', amount: -250, category: 'Transport', note: '' },
    { title: 'Netflix', amount: -199, category: 'Entertainment', note: '' },
  ];

  for (const tx of transactions) {
    db.runSync(
      'INSERT INTO transactions (id, title, amount, note, date, category_id, account_id, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)',
      generateId(), tx.title, tx.amount, tx.note, today, catMap[tx.category], cashAccountId, now, now
    );
  }

  // Seed budgets for current month
  const budgets = [
    { category: 'Food & Dining', limit: 5000 },
    { category: 'Transport', limit: 2000 },
    { category: 'Entertainment', limit: 1500 },
    { category: 'Shopping', limit: 3000 },
    { category: 'Bills & Utilities', limit: 2500 },
  ];

  for (const b of budgets) {
    db.runSync(
      'INSERT INTO budgets (id, category_id, limit_amount, month, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, 0, 0)',
      generateId(), catMap[b.category], b.limit, currentMonth, now, now
    );
  }

  // Seed goals
  const goals = [
    { name: 'Emergency Fund', icon: 'shield', target: 100000, saved: 45000, color: '#000000' },
    { name: 'New Laptop', icon: 'monitor', target: 80000, saved: 32000, color: '#525252' },
    { name: 'Vacation', icon: 'map', target: 50000, saved: 12000, color: '#A3A3A3' },
  ];

  for (const g of goals) {
    db.runSync(
      'INSERT INTO goals (id, name, icon, target, saved, color, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)',
      generateId(), g.name, g.icon, g.target, g.saved, g.color, now, now
    );
  }
}
