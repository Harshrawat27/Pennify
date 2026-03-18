import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNTS_KEY = 'spendler_accounts_cache';
const CATEGORIES_KEY = 'spendler_categories_cache';
const PARENT_CATEGORIES_KEY = 'spendler_parent_categories_cache';
const RULES_KEY = 'spendler_rules_cache';

export interface CachedRule {
  _id: string;
  keyword: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  createdAt: string;
}

export interface CachedAccount {
  _id: string;
  name: string;
  type: string;
  icon: string;
  isActive?: boolean;
}

export interface CachedParentCategory {
  _id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface CachedCategory {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: string; // 'expense' | 'income'
  parentCategoryId?: string;
  parentCategoryName?: string;
  parentCategoryColor?: string;
  isDefault?: boolean;
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

export async function getCachedParentCategories(): Promise<CachedParentCategory[]> {
  try {
    const raw = await AsyncStorage.getItem(PARENT_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setCachedParentCategories(categories: CachedParentCategory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PARENT_CATEGORIES_KEY, JSON.stringify(categories));
  } catch {}
}

export async function getCachedRules(): Promise<CachedRule[]> {
  try {
    const raw = await AsyncStorage.getItem(RULES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setCachedRules(rules: CachedRule[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RULES_KEY, JSON.stringify(rules));
  } catch {}
}
