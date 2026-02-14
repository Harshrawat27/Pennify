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

  // Screen 7 - Categories
  selectedCategories: string[];
  customCategories: string[];

  // Screen 8 - Recurring Payments
  recurringPayments: RecurringPayment[];

  // Screen 9 - Goals
  goals: OnboardingGoal[];

  // Screen 10 - Notifications
  notificationsEnabled: boolean;
  dailyReminder: boolean;
  weeklyReport: boolean;

  // Actions
  setCurrency: (code: string) => void;
  setAccounts: (accounts: OnboardingAccount[]) => void;
  setOverallBalance: (balance: string) => void;
  setMonthlyBudget: (amount: number) => void;
  setTrackIncome: (track: boolean) => void;
  setSelectedCategories: (categories: string[]) => void;
  setCustomCategories: (categories: string[]) => void;
  setRecurringPayments: (payments: RecurringPayment[]) => void;
  setGoals: (goals: OnboardingGoal[]) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setDailyReminder: (enabled: boolean) => void;
  setWeeklyReport: (enabled: boolean) => void;
  reset: () => void;
}

const initialState = {
  currency: 'USD',
  accounts: [{ name: 'Cash', type: 'cash' as const, icon: 'credit-card' as FeatherIcon, balance: 0 }],
  overallBalance: '',
  monthlyBudget: 5000,
  trackIncome: true,
  selectedCategories: [
    'Food & Dining',
    'Transport',
    'Shopping',
    'Bills & Utilities',
    'Entertainment',
  ],
  customCategories: [] as string[],
  recurringPayments: [] as RecurringPayment[],
  goals: [] as OnboardingGoal[],
  notificationsEnabled: true,
  dailyReminder: true,
  weeklyReport: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setCurrency: (code) => set({ currency: code }),
  setAccounts: (accounts) => set({ accounts }),
  setOverallBalance: (balance) => set({ overallBalance: balance }),
  setMonthlyBudget: (amount) => set({ monthlyBudget: amount }),
  setTrackIncome: (track) => set({ trackIncome: track }),
  setSelectedCategories: (categories) => set({ selectedCategories: categories }),
  setCustomCategories: (categories) => set({ customCategories: categories }),
  setRecurringPayments: (payments) => set({ recurringPayments: payments }),
  setGoals: (goals) => set({ goals: goals }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setDailyReminder: (enabled) => set({ dailyReminder: enabled }),
  setWeeklyReport: (enabled) => set({ weeklyReport: enabled }),
  reset: () => set(initialState),
}));
