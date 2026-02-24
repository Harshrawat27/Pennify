import { create } from 'zustand';
import * as dal from '../dal';

interface SettingsState {
  currency: string;
  hasOnboarded: string | null; // null | 'pending_auth' | 'true'
  monthlyBudget: number; // current month's budget (from monthly_budgets table)
  overallBalance: number; // derived: initial account balances + SUM(all transactions)
  trackIncome: boolean;

  load: () => void;
  setCurrency: (code: string) => void;
  setHasOnboarded: (value: string) => void;
  setMonthlyBudget: (amount: number) => void;
  setTrackIncome: (track: boolean) => void;
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'INR',
  hasOnboarded: null,
  monthlyBudget: 0,
  overallBalance: 0,
  trackIncome: true,

  load: () => {
    const pref = dal.getUserPreferences();
    const mb = dal.getBudgetForMonth(getCurrentMonth());

    set({
      currency: pref?.currency ?? 'INR',
      hasOnboarded: pref?.has_onboarded ?? null,
      // Derived from initial account balances + SUM(all transactions) — never stale
      overallBalance: dal.getTotalBalance(),
      trackIncome: pref?.track_income !== 0,
      monthlyBudget: mb?.budget ?? 0,
    });
  },

  setCurrency: (code) => {
    dal.updatePreference('currency', code);
    set({ currency: code });
  },

  setHasOnboarded: (value) => {
    dal.updatePreference('has_onboarded', value);
    set({ hasOnboarded: value });
  },

  setMonthlyBudget: (amount) => {
    dal.setMonthlyBudget(getCurrentMonth(), amount);
    set({ monthlyBudget: amount });
  },

  setTrackIncome: (track) => {
    dal.updatePreference('track_income', track ? 1 : 0);
    set({ trackIncome: track });
  },
}));
