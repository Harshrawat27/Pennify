import { getDatabase } from './client';

type Migration = {
  version: number;
  up: string[];
};

const migrations: Migration[] = [
  {
    version: 1,
    up: [
      `CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'cash',
        balance REAL NOT NULL DEFAULT 0,
        icon TEXT NOT NULL DEFAULT 'credit-card',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'expense',
        color TEXT NOT NULL DEFAULT '#000000',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        category_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      )`,
      `CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        limit_amount REAL NOT NULL,
        month TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )`,
      `CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'target',
        target REAL NOT NULL,
        saved REAL NOT NULL DEFAULT 0,
        color TEXT NOT NULL DEFAULT '#000000',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)`,
      `CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month)`,
    ],
  },
  {
    version: 2,
    up: [
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
    ],
  },
  {
    version: 3,
    up: [
      // Sync + soft-delete columns for all data tables
      `ALTER TABLE accounts ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE accounts ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE categories ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE categories ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE transactions ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE transactions ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE budgets ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE budgets ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE goals ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE goals ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0`,
      // Settings only needs synced (no soft-delete for key-value settings)
      `ALTER TABLE settings ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
      // Settings needs updated_at for sync conflict resolution
      `ALTER TABLE settings ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`,
    ],
  },
  {
    version: 4,
    up: [
      `CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY,
        email TEXT DEFAULT '',
        currency TEXT NOT NULL DEFAULT 'INR',
        overall_balance REAL NOT NULL DEFAULT 0,
        track_income INTEGER NOT NULL DEFAULT 1,
        notifications_enabled INTEGER NOT NULL DEFAULT 1,
        daily_reminder INTEGER NOT NULL DEFAULT 1,
        weekly_report INTEGER NOT NULL DEFAULT 1,
        sync_enabled INTEGER NOT NULL DEFAULT 1,
        has_onboarded TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS monthly_budgets (
        id TEXT PRIMARY KEY,
        month TEXT NOT NULL UNIQUE,
        budget REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER NOT NULL DEFAULT 0,
        deleted INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE INDEX IF NOT EXISTS idx_monthly_budgets_month ON monthly_budgets(month)`,
    ],
  },
];

export function runMigrations(): void {
  const db = getDatabase();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = db.getAllSync<{ version: number }>(
    'SELECT version FROM _migrations ORDER BY version'
  );
  const appliedSet = new Set(applied.map((r) => r.version));

  for (const migration of migrations) {
    if (appliedSet.has(migration.version)) continue;

    db.execSync('BEGIN');
    try {
      for (const sql of migration.up) {
        db.execSync(sql);
      }
      db.runSync('INSERT INTO _migrations (version) VALUES (?)', migration.version);
      db.execSync('COMMIT');
    } catch (e) {
      db.execSync('ROLLBACK');
      throw e;
    }
  }
}
