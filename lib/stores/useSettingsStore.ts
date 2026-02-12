import { create } from 'zustand';
import * as dal from '../dal';

interface SettingsState {
  currency: string;

  load: () => void;
  setCurrency: (code: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'INR',

  load: () => {
    const currency = dal.getSetting('currency') ?? 'INR';
    set({ currency });
  },

  setCurrency: (code) => {
    dal.setSetting('currency', code);
    set({ currency: code });
  },
}));
