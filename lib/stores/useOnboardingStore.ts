import { create } from 'zustand';
import type { FeatherIcon } from '../models/types';

export interface OnboardingAccount {
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'wallet';
  icon: FeatherIcon;
  balance: number;
}

export interface OnboardingGoal {
  name: string;
  icon: FeatherIcon;
  target: string;
  color: string;
}

export interface RecurringPayment {
  name: string;
  amount: string;
  frequency: 'monthly' | 'yearly';
  billingDay?: number;
  purchasedAt?: string; // YYYY-MM-DD — full date user picked (display only)
}

interface OnboardingState {
  // Screen 2 - Currency
  currency: string;

  // Screen 3 - Accounts
  accounts: OnboardingAccount[];

  // Screen 4 - Overall Balance (optional)
  overallBalance: string;

  // Screen 5 - Monthly Budget
  monthlyBudget: number;

  // Screen 6 - Track Income
  trackIncome: boolean;

  // Screen 7 - Categories (custom only; 40 defaults are auto-created)
  customCategories: { name: string; parentCategory?: string }[];

  // Screen 8 - Recurring Payments
  recurringPayments: RecurringPayment[];

  // Screen 9 - Goals
  goals: OnboardingGoal[];

  // Screen 10 - Notifications
  notificationsEnabled: boolean;
  dailyReminder: boolean;
  weeklyReport: boolean;

  // Screen 5 (new) - Category Budgets (keyed by parent category name)
  categoryBudgets: { parentCategoryName: string; limitAmount: number }[];

  // Screen 8 (new) - Smart Rules
  smartRules: { keyword: string; categoryName: string; categoryIcon: string; categoryColor: string }[];

  // Actions
  setCurrency: (code: string) => void;
  setAccounts: (accounts: OnboardingAccount[]) => void;
  setOverallBalance: (balance: string) => void;
  setMonthlyBudget: (amount: number) => void;
  setTrackIncome: (track: boolean) => void;
  setCustomCategories: (categories: { name: string; parentCategory?: string }[]) => void;
  setRecurringPayments: (payments: RecurringPayment[]) => void;
  setGoals: (goals: OnboardingGoal[]) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setDailyReminder: (enabled: boolean) => void;
  setWeeklyReport: (enabled: boolean) => void;
  setCategoryBudgets: (budgets: { parentCategoryName: string; limitAmount: number }[]) => void;
  setSmartRules: (rules: { keyword: string; categoryName: string; categoryIcon: string; categoryColor: string }[]) => void;
  reset: () => void;
}

const initialState = {
  currency: 'USD',
  accounts: [{ name: 'Cash', type: 'cash' as const, icon: 'credit-card' as FeatherIcon, balance: 0 }],
  overallBalance: '',
  monthlyBudget: 5000,
  trackIncome: true,
  customCategories: [] as { name: string; parentCategory?: string }[],
  recurringPayments: [] as RecurringPayment[],
  goals: [] as OnboardingGoal[],
  notificationsEnabled: true,
  dailyReminder: true,
  weeklyReport: false,
  categoryBudgets: [] as { parentCategoryName: string; limitAmount: number }[],
  smartRules: [] as { keyword: string; categoryName: string; categoryIcon: string; categoryColor: string }[],
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setCurrency: (code) => set({ currency: code }),
  setAccounts: (accounts) => set({ accounts }),
  setOverallBalance: (balance) => set({ overallBalance: balance }),
  setMonthlyBudget: (amount) => set({ monthlyBudget: amount }),
  setTrackIncome: (track) => set({ trackIncome: track }),
  setCustomCategories: (categories) => set({ customCategories: categories }),
  setRecurringPayments: (payments) => set({ recurringPayments: payments }),
  setGoals: (goals) => set({ goals: goals }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setDailyReminder: (enabled) => set({ dailyReminder: enabled }),
  setWeeklyReport: (enabled) => set({ weeklyReport: enabled }),
  setCategoryBudgets: (budgets) => set({ categoryBudgets: budgets }),
  setSmartRules: (rules) => set({ smartRules: rules }),
  reset: () => set(initialState),
}));
