import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNTS_KEY = 'pennify_accounts_cache';
const CATEGORIES_KEY = 'pennify_categories_cache';

export interface CachedAccount {
  _id: string;
  name: string;
  type: string;
  icon: string;
  isActive?: boolean;
}

export interface CachedCategory {
  _id: string;
  name: string;
  icon: string;
  type: string; // 'expense' | 'income'
}

export async function getCachedAccounts(): Promise<CachedAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setCachedAccounts(accounts: CachedAccount[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}
}

export async function getCachedCategories(): Promise<CachedCategory[]> {
  try {
    const raw = await AsyncStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setCachedCategories(categories: CachedCategory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch {}
}
