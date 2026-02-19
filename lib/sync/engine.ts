import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getDatabase } from '../db/client';

const SYNC_INTERVAL_MS = 30_000;

type UnsyncedRow = Record<string, unknown> & {
  id: string;
  updated_at: string;
  deleted?: number;
};

type UnsyncedPref = {
  id: string;
  email: string;
  currency: string;
  overall_balance: number;
  track_income: number;
  notifications_enabled: number;
  daily_reminder: number;
  weekly_report: number;
  sync_enabled: number;
  has_onboarded: string | null;
  updated_at: string;
  synced: number;
};

// Module-level ref so triggerSync() can be called from stores
let _activeEngine: SyncEngine | null = null;

/** Trigger an immediate push to Convex (call after local writes) */
export function triggerSync() {
  _activeEngine?.syncNow();
}

export class SyncEngine {
  private client: ConvexReactClient;
  private userId: string;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private unsubscribeNetInfo: (() => void) | null = null;
  private isOnline = false;
  private isSyncing = false;

  constructor(client: ConvexReactClient, userId: string) {
    this.client = client;
    this.userId = userId;
    _activeEngine = this;
  }

  start() {
    this.unsubscribeNetInfo = NetInfo.addEventListener(
      (state: NetInfoState) => {
        const wasOffline = !this.isOnline;
        this.isOnline = !!state.isConnected && !!state.isInternetReachable;
        if (wasOffline && this.isOnline) {
          void this.syncNow();
        }
      }
    );

    this.intervalId = setInterval(() => {
      if (this.isOnline) {
        void this.syncNow();
      }
    }, SYNC_INTERVAL_MS);

    // Immediately check and sync
    void NetInfo.fetch().then((state) => {
      this.isOnline = !!state.isConnected && !!state.isInternetReachable;
      if (this.isOnline) {
        void this.syncNow();
      }
    });
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    if (_activeEngine === this) _activeEngine = null;
  }

  /**
   * Cloud is empty (deleted/new account). Wipe old data that doesn't
   * belong to this user, keep only the fresh onboarding data, and
   * mark everything synced=0 so it pushes to cloud.
   */
  resetLocalForFreshAccount() {
    const db = getDatabase();
    // Delete old transactions, budgets, goals that have synced=1
    // (they belonged to the previous account and cloud no longer has them)
    db.execSync('DELETE FROM transactions WHERE synced = 1');
    db.execSync('DELETE FROM budgets WHERE synced = 1');
    db.execSync('DELETE FROM goals WHERE synced = 1');
    db.execSync('DELETE FROM accounts WHERE synced = 1');
    db.execSync('DELETE FROM categories WHERE synced = 1');
    db.execSync('DELETE FROM settings WHERE synced = 1');
    db.execSync('DELETE FROM monthly_budgets WHERE synced = 1');

    // Mark remaining data (fresh onboarding) as unsynced so it pushes
    db.execSync('UPDATE accounts SET synced = 0');
    db.execSync('UPDATE categories SET synced = 0');
    db.execSync('UPDATE transactions SET synced = 0');
    db.execSync('UPDATE budgets SET synced = 0');
    db.execSync('UPDATE goals SET synced = 0');
    db.execSync('UPDATE user_preferences SET synced = 0');
    db.execSync('UPDATE monthly_budgets SET synced = 0');
  }

  async syncNow() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      await this.push();
    } catch (e) {
      console.warn('[SyncEngine] push failed:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  private async push() {
    const db = getDatabase();

    const unsyncedAccounts = db.getAllSync<UnsyncedRow>(
      'SELECT * FROM accounts WHERE synced = 0'
    );
    const unsyncedCategories = db.getAllSync<UnsyncedRow>(
      'SELECT * FROM categories WHERE synced = 0'
    );
    const unsyncedTransactions = db.getAllSync<UnsyncedRow>(
      'SELECT * FROM transactions WHERE synced = 0'
    );
    const unsyncedBudgets = db.getAllSync<UnsyncedRow>(
      'SELECT * FROM budgets WHERE synced = 0'
    );
    const unsyncedGoals = db.getAllSync<UnsyncedRow>(
      'SELECT * FROM goals WHERE synced = 0'
    );
    const unsyncedSettings = db.getAllSync<{
      key: string;
      value: string;
      updated_at: string;
      synced: number;
    }>('SELECT * FROM settings WHERE synced = 0');

    // New tables
    const unsyncedPref = db.getFirstSync<UnsyncedPref>(
      'SELECT * FROM user_preferences WHERE synced = 0 LIMIT 1'
    );
    const unsyncedMonthlyBudgets = db.getAllSync<UnsyncedRow>(
      'SELECT * FROM monthly_budgets WHERE synced = 0'
    );

    const hasUnsynced =
      unsyncedAccounts.length +
      unsyncedCategories.length +
      unsyncedTransactions.length +
      unsyncedBudgets.length +
      unsyncedGoals.length +
      unsyncedSettings.length +
      (unsyncedPref ? 1 : 0) +
      unsyncedMonthlyBudgets.length;

    if (hasUnsynced === 0) return;

    // Helper: only include `deleted: true` when actually deleted
    function mapDeleted(r: UnsyncedRow) {
      return (r.deleted as number) === 1 ? { deleted: true as const } : {};
    }

    await this.client.mutation(api.sync.pushBatch, {
      userId: this.userId,
      accounts: unsyncedAccounts.map((r) => ({
        localId: r.id as string,
        name: r.name as string,
        type: r.type as string,
        balance: r.balance as number,
        icon: r.icon as string,
        updatedAt: r.updated_at,
        ...mapDeleted(r),
      })),
      categories: unsyncedCategories.map((r) => ({
        localId: r.id as string,
        name: r.name as string,
        icon: r.icon as string,
        type: r.type as string,
        color: r.color as string,
        updatedAt: r.updated_at,
        ...mapDeleted(r),
      })),
      transactions: unsyncedTransactions.map((r) => ({
        localId: r.id as string,
        title: r.title as string,
        amount: r.amount as number,
        note: r.note as string,
        date: r.date as string,
        categoryLocalId: r.category_id as string,
        accountLocalId: r.account_id as string,
        updatedAt: r.updated_at,
        ...mapDeleted(r),
      })),
      budgets: unsyncedBudgets.map((r) => ({
        localId: r.id as string,
        categoryLocalId: r.category_id as string,
        limitAmount: r.limit_amount as number,
        month: r.month as string,
        updatedAt: r.updated_at,
        ...mapDeleted(r),
      })),
      goals: unsyncedGoals.map((r) => ({
        localId: r.id as string,
        name: r.name as string,
        icon: r.icon as string,
        target: r.target as number,
        saved: r.saved as number,
        color: r.color as string,
        updatedAt: r.updated_at,
        ...mapDeleted(r),
      })),
      settings: unsyncedSettings.map((r) => ({
        key: r.key,
        value: r.value,
        updatedAt: r.updated_at,
      })),
      userPreferences: unsyncedPref
        ? {
            localId: unsyncedPref.id,
            email: unsyncedPref.email || undefined,
            currency: unsyncedPref.currency,
            overall_balance: unsyncedPref.overall_balance,
            track_income: unsyncedPref.track_income === 1,
            notifications_enabled: unsyncedPref.notifications_enabled === 1,
            daily_reminder: unsyncedPref.daily_reminder === 1,
            weekly_report: unsyncedPref.weekly_report === 1,
            sync_enabled: unsyncedPref.sync_enabled === 1,
            has_onboarded: unsyncedPref.has_onboarded || undefined,
            updatedAt: unsyncedPref.updated_at,
          }
        : undefined,
      monthlyBudgets: unsyncedMonthlyBudgets.map((r) => ({
        localId: r.id as string,
        month: r.month as string,
        budget: r.budget as number,
        updatedAt: r.updated_at,
        ...mapDeleted(r),
      })),
    });

    // Mark pushed rows as synced (per-row to avoid race conditions)
    for (const r of unsyncedAccounts)
      db.runSync('UPDATE accounts SET synced = 1 WHERE id = ? AND updated_at = ?', r.id, r.updated_at);
    for (const r of unsyncedCategories)
      db.runSync('UPDATE categories SET synced = 1 WHERE id = ? AND updated_at = ?', r.id, r.updated_at);
    for (const r of unsyncedTransactions)
      db.runSync('UPDATE transactions SET synced = 1 WHERE id = ? AND updated_at = ?', r.id, r.updated_at);
    for (const r of unsyncedBudgets)
      db.runSync('UPDATE budgets SET synced = 1 WHERE id = ? AND updated_at = ?', r.id, r.updated_at);
    for (const r of unsyncedGoals)
      db.runSync('UPDATE goals SET synced = 1 WHERE id = ? AND updated_at = ?', r.id, r.updated_at);
    for (const r of unsyncedSettings)
      db.runSync('UPDATE settings SET synced = 1 WHERE key = ? AND updated_at = ?', r.key, r.updated_at);
    if (unsyncedPref)
      db.runSync('UPDATE user_preferences SET synced = 1 WHERE id = ? AND updated_at = ?', unsyncedPref.id, unsyncedPref.updated_at);
    for (const r of unsyncedMonthlyBudgets)
      db.runSync('UPDATE monthly_budgets SET synced = 1 WHERE id = ? AND updated_at = ?', r.id, r.updated_at);

    // Purge soft-deleted rows that have been synced
    db.execSync('DELETE FROM accounts WHERE deleted = 1 AND synced = 1');
    db.execSync('DELETE FROM categories WHERE deleted = 1 AND synced = 1');
    db.execSync('DELETE FROM transactions WHERE deleted = 1 AND synced = 1');
    db.execSync('DELETE FROM budgets WHERE deleted = 1 AND synced = 1');
    db.execSync('DELETE FROM goals WHERE deleted = 1 AND synced = 1');
    db.execSync('DELETE FROM monthly_budgets WHERE deleted = 1 AND synced = 1');
  }

  async pullFromCloud(replaceLocal = false): Promise<boolean> {
    try {
      const data = await this.client.query(api.sync.pullAll, { userId: this.userId });
      if (!data) return false;

      const db = getDatabase();
      const { accounts, categories, transactions, budgets, goals, settings, userPreferences, monthlyBudgets } = data;

      const hasData =
        accounts.length +
        categories.length +
        transactions.length +
        budgets.length +
        goals.length +
        settings.length +
        (userPreferences ? 1 : 0) +
        monthlyBudgets.length;

      if (hasData === 0) return false;

      db.execSync('BEGIN');
      try {
        if (replaceLocal) {
          db.execSync('DELETE FROM transactions');
          db.execSync('DELETE FROM budgets');
          db.execSync('DELETE FROM goals');
          db.execSync('DELETE FROM accounts');
          db.execSync('DELETE FROM categories');
          db.execSync('DELETE FROM settings');
          db.execSync('DELETE FROM monthly_budgets');
          // Don't delete user_preferences — update in place
        }

        for (const a of accounts) {
          if (a.deleted) continue;
          const exists = db.getFirstSync<{ id: string }>(
            'SELECT id FROM accounts WHERE id = ?',
            a.localId
          );
          if (!exists) {
            db.runSync(
              'INSERT INTO accounts (id, name, type, balance, icon, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)',
              a.localId, a.name, a.type, a.balance, a.icon, a.updatedAt, a.updatedAt
            );
          }
        }

        for (const c of categories) {
          if (c.deleted) continue;
          const exists = db.getFirstSync<{ id: string }>(
            'SELECT id FROM categories WHERE id = ?',
            c.localId
          );
          if (!exists) {
            db.runSync(
              'INSERT INTO categories (id, name, icon, type, color, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)',
              c.localId, c.name, c.icon, c.type, c.color, c.updatedAt, c.updatedAt
            );
          }
        }

        for (const t of transactions) {
          if (t.deleted) continue;
          const exists = db.getFirstSync<{ id: string }>(
            'SELECT id FROM transactions WHERE id = ?',
            t.localId
          );
          if (!exists) {
            db.runSync(
              'INSERT INTO transactions (id, title, amount, note, date, category_id, account_id, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)',
              t.localId, t.title, t.amount, t.note, t.date, t.categoryLocalId, t.accountLocalId, t.updatedAt, t.updatedAt
            );
          }
        }

        for (const b of budgets) {
          if (b.deleted) continue;
          const exists = db.getFirstSync<{ id: string }>(
            'SELECT id FROM budgets WHERE id = ?',
            b.localId
          );
          if (!exists) {
            db.runSync(
              'INSERT INTO budgets (id, category_id, limit_amount, month, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, 1, 0)',
              b.localId, b.categoryLocalId, b.limitAmount, b.month, b.updatedAt, b.updatedAt
            );
          }
        }

        for (const g of goals) {
          if (g.deleted) continue;
          const exists = db.getFirstSync<{ id: string }>(
            'SELECT id FROM goals WHERE id = ?',
            g.localId
          );
          if (!exists) {
            db.runSync(
              'INSERT INTO goals (id, name, icon, target, saved, color, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)',
              g.localId, g.name, g.icon, g.target, g.saved, g.color, g.updatedAt, g.updatedAt
            );
          }
        }

        // Legacy settings — keep for backward compatibility
        for (const s of settings) {
          const local = db.getFirstSync<{ synced: number }>(
            'SELECT synced FROM settings WHERE key = ?',
            s.key
          );
          if (local && local.synced === 0) continue;

          db.runSync(
            'INSERT OR REPLACE INTO settings (key, value, synced, updated_at) VALUES (?, ?, 1, ?)',
            s.key, s.value, s.updatedAt
          );
        }

        // User preferences (single row)
        if (userPreferences) {
          const localPref = db.getFirstSync<{ id: string; synced: number }>(
            'SELECT id, synced FROM user_preferences LIMIT 1'
          );
          if (localPref && localPref.synced === 0) {
            // Local has unsynced changes — skip cloud overwrite
          } else if (localPref) {
            // Update existing row with cloud data
            db.runSync(
              'UPDATE user_preferences SET email = ?, currency = ?, overall_balance = ?, track_income = ?, notifications_enabled = ?, daily_reminder = ?, weekly_report = ?, sync_enabled = ?, has_onboarded = ?, updated_at = ?, synced = 1 WHERE id = ?',
              userPreferences.email ?? '',
              userPreferences.currency,
              userPreferences.overall_balance,
              userPreferences.track_income ? 1 : 0,
              userPreferences.notifications_enabled ? 1 : 0,
              userPreferences.daily_reminder ? 1 : 0,
              userPreferences.weekly_report ? 1 : 0,
              userPreferences.sync_enabled ? 1 : 0,
              userPreferences.has_onboarded ?? null,
              userPreferences.updatedAt,
              localPref.id
            );
          } else {
            // No local row — insert from cloud
            db.runSync(
              'INSERT INTO user_preferences (id, email, currency, overall_balance, track_income, notifications_enabled, daily_reminder, weekly_report, sync_enabled, has_onboarded, created_at, updated_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
              userPreferences.localId,
              userPreferences.email ?? '',
              userPreferences.currency,
              userPreferences.overall_balance,
              userPreferences.track_income ? 1 : 0,
              userPreferences.notifications_enabled ? 1 : 0,
              userPreferences.daily_reminder ? 1 : 0,
              userPreferences.weekly_report ? 1 : 0,
              userPreferences.sync_enabled ? 1 : 0,
              userPreferences.has_onboarded ?? null,
              userPreferences.updatedAt,
              userPreferences.updatedAt
            );
          }
        }

        // Monthly budgets
        for (const mb of monthlyBudgets) {
          if (mb.deleted) continue;
          const exists = db.getFirstSync<{ id: string }>(
            'SELECT id FROM monthly_budgets WHERE id = ?',
            mb.localId
          );
          if (!exists) {
            db.runSync(
              'INSERT INTO monthly_budgets (id, month, budget, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, 1, 0)',
              mb.localId, mb.month, mb.budget, mb.updatedAt, mb.updatedAt
            );
          }
        }

        db.execSync('COMMIT');
      } catch (e) {
        db.execSync('ROLLBACK');
        throw e;
      }

      return hasData > 0;
    } catch (e) {
      console.warn('[SyncEngine] pull failed:', e);
      return false;
    }
  }
}
