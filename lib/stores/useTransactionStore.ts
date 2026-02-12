import { create } from 'zustand';
import type { TransactionWithCategory } from '../models/types';
import * as dal from '../dal';

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
    get().load();
  },

  removeTransaction: (id) => {
    dal.deleteTransaction(id);
    get().load();
  },
}));
