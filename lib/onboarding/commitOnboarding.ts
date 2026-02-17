import * as dal from '../dal';
import { useOnboardingStore } from '../stores/useOnboardingStore';

/**
 * Writes onboarding store state → SQLite via DAL.
 * Called once after screen 11 (Motivational), before sign-in.
 */
export function commitOnboarding(): void {
  const state = useOnboardingStore.getState();

  // Currency
  dal.setSetting('currency', state.currency);

  // Monthly budget
  dal.setSetting('monthlyBudget', String(state.monthlyBudget));

  // Overall balance (optional)
  if (state.overallBalance.trim()) {
    dal.setSetting('overallBalance', state.overallBalance.trim());
  }

  // Track income preference
  dal.setSetting('trackIncome', String(state.trackIncome));

  // Accounts — apply overallBalance to first account if set
  const overallNum = parseFloat(state.overallBalance);
  for (let i = 0; i < state.accounts.length; i++) {
    const acc = state.accounts[i];
    dal.createAccount({
      name: acc.name,
      type: acc.type,
      balance: i === 0 && !isNaN(overallNum) ? overallNum : acc.balance,
      icon: acc.icon,
    });
  }

  // Icon map for default onboarding categories
  const CATEGORY_ICONS: Record<string, string> = {
    'Food & Dining': 'shopping-bag',
    'Transport': 'navigation',
    'Entertainment': 'play-circle',
    'Shopping': 'shopping-cart',
    'Bills & Utilities': 'zap',
    'Health': 'heart',
    'Education': 'book',
    'Subscriptions': 'refresh-cw',
    'Groceries': 'package',
    'Rent': 'home',
    'Insurance': 'shield',
    'Personal Care': 'smile',
    'Gifts': 'gift',
    'Travel': 'map',
  };

  // Create ALL selected categories that don't exist in DB yet
  const existingCategories = dal.getAllCategories();
  const existingNames = new Set(existingCategories.map((c) => c.name));

  for (const name of state.selectedCategories) {
    if (!existingNames.has(name)) {
      dal.createCategory({
        name,
        icon: (CATEGORY_ICONS[name] ?? 'tag') as any,
        type: 'expense',
        color: '#525252',
      });
    }
  }

  // Also create any custom categories (user-typed names not in defaults)
  for (const name of state.customCategories) {
    if (!existingNames.has(name) && !state.selectedCategories.includes(name)) {
      dal.createCategory({
        name,
        icon: 'tag',
        type: 'expense',
        color: '#525252',
      });
    }
  }

  // Soft-delete expense categories user didn't select (keep all income categories)
  const keepNames = new Set([...state.selectedCategories, ...state.customCategories]);
  const allCategories = dal.getAllCategories();
  for (const cat of allCategories) {
    if (cat.type === 'expense' && !keepNames.has(cat.name)) {
      dal.deleteCategory(cat.id);
    }
  }

  // Recurring payments (store as JSON setting for now)
  if (state.recurringPayments.length > 0) {
    dal.setSetting('recurringPayments', JSON.stringify(state.recurringPayments));
  }

  // Goals
  for (const goal of state.goals) {
    const target = parseFloat(goal.target);
    if (!isNaN(target) && target > 0) {
      dal.createGoal({
        name: goal.name,
        icon: goal.icon,
        target,
        color: goal.color,
      });
    }
  }

  // Notification preferences
  dal.setSetting('notificationsEnabled', String(state.notificationsEnabled));
  dal.setSetting('dailyReminder', String(state.dailyReminder));
  dal.setSetting('weeklyReport', String(state.weeklyReport));

  // Selected categories list (for reference)
  dal.setSetting('selectedCategories', JSON.stringify(state.selectedCategories));
}
