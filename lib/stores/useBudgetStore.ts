import { create } from 'zustand';
import type { BudgetWithCategory } from '../models/types';
import * as dal from '../dal';

interface BudgetState {
  budgets: BudgetWithCategory[];
  currentMonth: string;

  load: (month?: string) => void;
  addBudget: (data: Parameters<typeof dal.createBudget>[0]) => void;
  removeBudget: (id: string) => void;
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  currentMonth: getCurrentMonth(),

  load: (month?: string) => {
    const m = month ?? get().currentMonth;
    const budgets = dal.getBudgetsByMonth(m);
    set({ budgets, currentMonth: m });
  },

  addBudget: (data) => {
    dal.createBudget(data);
    get().load();
  },

  removeBudget: (id) => {
    dal.deleteBudget(id);
    get().load();
  },
}));
