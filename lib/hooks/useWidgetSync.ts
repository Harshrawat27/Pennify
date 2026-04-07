import { getCurrencySymbol } from '@/lib/utils/currency';
import { useEffect } from 'react';
import { Platform } from 'react-native';

interface Transaction {
  amount: number;
  type: string;
  title: string;
  date: string;
}

interface WidgetSyncParams {
  transactions: Transaction[] | undefined;
  monthlySpent: number;
  monthlyBudget: number;
  currency: string;
}

const SUITE_NAME = 'group.app.spendler';

async function writeToSharedStorage(data: Record<string, string>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@bacons/apple-targets');
    const ExpoAppleTargets = mod.default ?? mod;
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        ExpoAppleTargets.setItemAsync(SUITE_NAME, key, value)
      )
    );
  } catch {
    // Native module unavailable (Android / dev without prebuild)
  }
}

/**
 * Syncs spending data to the iOS widget via App Groups shared storage.
 * No-op on Android or when data is not yet loaded.
 */
export function useWidgetSync({
  transactions,
  monthlySpent,
  monthlyBudget,
  currency,
}: WidgetSyncParams) {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!transactions) return;

    const symbol = getCurrencySymbol(currency);

    // Today's spending: sum all expense transactions dated today
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySpent = transactions
      .filter(
        (tx) => tx.type === 'expense' && tx.date.slice(0, 10) === todayStr
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Most recent expense for "last transaction"
    const lastExpense = transactions.find((tx) => tx.type === 'expense');
    const lastTitle = lastExpense?.title ?? '';
    const lastAmount = lastExpense
      ? `${symbol}${lastExpense.amount.toFixed(0)}`
      : '';

    void writeToSharedStorage({
      spendler_today_spent: String(todaySpent),
      spendler_monthly_spent: String(monthlySpent),
      spendler_monthly_budget: String(monthlyBudget),
      spendler_currency_symbol: symbol,
      spendler_last_tx_title: lastTitle,
      spendler_last_tx_amount: lastAmount,
    });
  }, [transactions, monthlySpent, monthlyBudget, currency]);
}
