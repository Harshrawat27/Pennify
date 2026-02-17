import { create } from 'zustand';
import * as dal from '../dal';

interface SettingsState {
  currency: string;
  hasOnboarded: string | null; // null | 'pending_auth' | 'true'
  monthlyBudget: number;
  overallBalance: string;
  monthlyBudgetLeft: number;
  trackIncome: boolean;

  load: () => void;
  setCurrency: (code: string) => void;
  setHasOnboarded: (value: string) => void;
  setMonthlyBudget: (amount: number) => void;
  setOverallBalance: (balance: string) => void;
  setMonthlyBudgetLeft: (amount: number) => void;
  setTrackIncome: (track: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'INR',
  hasOnboarded: null,
  monthlyBudget: 0,
  overallBalance: '',
  monthlyBudgetLeft: 0,
  trackIncome: true,

  load: () => {
    const currency = dal.getSetting('currency') ?? 'INR';
    const hasOnboarded = dal.getSetting('hasOnboarded');
    const monthlyBudget = Number(dal.getSetting('monthlyBudget') ?? '0');
    const overallBalance = dal.getSetting('overallBalance') ?? '';
    const monthlyBudgetLeft = Number(dal.getSetting('monthlyBudgetLeft') ?? '0');
    const trackIncome = dal.getSetting('trackIncome') !== 'false';
    set({ currency, hasOnboarded, monthlyBudget, overallBalance, monthlyBudgetLeft, trackIncome });
  },

  setCurrency: (code) => {
    dal.setSetting('currency', code);
    set({ currency: code });
  },

  setHasOnboarded: (value) => {
    dal.setSetting('hasOnboarded', value);
    set({ hasOnboarded: value });
  },

  setMonthlyBudget: (amount) => {
    dal.setSetting('monthlyBudget', String(amount));
    set({ monthlyBudget: amount });
  },

  setOverallBalance: (balance) => {
    dal.setSetting('overallBalance', balance);
    set({ overallBalance: balance });
  },

  setMonthlyBudgetLeft: (amount) => {
    dal.setSetting('monthlyBudgetLeft', String(amount));
    set({ monthlyBudgetLeft: amount });
  },

  setTrackIncome: (track) => {
    dal.setSetting('trackIncome', String(track));
    set({ trackIncome: track });
  },
}));
