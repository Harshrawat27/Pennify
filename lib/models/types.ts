import type { Feather } from '@expo/vector-icons';

export type FeatherIcon = React.ComponentProps<typeof Feather>['name'];

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'wallet';
  balance: number;
  icon: FeatherIcon;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: FeatherIcon;
  type: 'expense' | 'income';
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number; // positive = income, negative = expense
  note: string;
  date: string; // ISO date string YYYY-MM-DD
  category_id: string;
  account_id: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_icon: FeatherIcon;
}

export interface Budget {
  id: string;
  category_id: string;
  limit_amount: number;
  month: string; // YYYY-MM
  created_at: string;
  updated_at: string;
}

export interface BudgetWithCategory extends Budget {
  category_name: string;
  category_icon: FeatherIcon;
  spent: number; // computed from transactions
}

export interface Goal {
  id: string;
  name: string;
  icon: FeatherIcon;
  target: number;
  saved: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryBreakdown {
  name: string;
  icon: FeatherIcon;
  amount: number;
  percent: number;
}

export interface DailySpending {
  day: string;
  amount: number;
}
