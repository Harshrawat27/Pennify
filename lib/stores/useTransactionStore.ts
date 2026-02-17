import { create } from 'zustand';
import type { TransactionWithCategory } from '../models/types';
import * as dal from '../dal';
import { triggerSync } from '../sync/engine';
import { useSettingsStore } from './useSettingsStore';

interface TransactionState {
  transactions: TransactionWithCategory[];
  income: number;
  expenses: number;
  currentMonth: string; // YYYY-MM

  load: (month?: string) => void;
  addTransaction: (data: Parameters<typeof dal.createTransaction>[0]) => void;
  removeTransaction: (id: string) => void;
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  income: 0,
  expenses: 0,
  currentMonth: getCurrentMonth(),

  load: (month?: string) => {
    const m = month ?? get().currentMonth;
    const transactions = dal.getTransactionsByMonth(m);
    const income = dal.getMonthlyIncome(m);
    const expenses = dal.getMonthlyExpenses(m);
    set({ transactions, income, expenses, currentMonth: m });
  },

  addTransaction: (data) => {
    dal.createTransaction(data);

    // Update account balance in accounts table
    const account = dal.getAccountById(data.account_id);
    if (account) {
      dal.updateAccountBalance(data.account_id, account.balance + data.amount);
    }

    // Update overallBalance setting — exact same method as currency
    // dal.setSetting writes to SQLite with synced=0 → push syncs to Convex
    const total = dal.getAllAccounts().reduce((sum, a) => sum + a.balance, 0);
    useSettingsStore.getState().setOverallBalance(String(total));

    get().load();
    triggerSync();
  },

  removeTransaction: (id) => {
    const tx = dal.getTransactionById(id);
    if (tx) {
      const account = dal.getAccountById(tx.account_id);
      if (account) {
        dal.updateAccountBalance(tx.account_id, account.balance - tx.amount);
      }
    }
    dal.deleteTransaction(id);

    // Update overallBalance setting — exact same method as currency
    const total = dal.getAllAccounts().reduce((sum, a) => sum + a.balance, 0);
    useSettingsStore.getState().setOverallBalance(String(total));

    get().load();
    triggerSync();
  },
}));
