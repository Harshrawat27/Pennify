import * as dal from '../dal';
import { useOnboardingStore } from '../stores/useOnboardingStore';

/**
 * Writes onboarding store state → SQLite via DAL.
 * Called once after screen 10 (Motivational), before sign-in.
 */
export function commitOnboarding(): void {
  const state = useOnboardingStore.getState();

  // User preferences — update the single row
  dal.updatePreference('currency', state.currency);
  dal.updatePreference('track_income', state.trackIncome ? 1 : 0);
  dal.updatePreference('notifications_enabled', state.notificationsEnabled ? 1 : 0);
  dal.updatePreference('daily_reminder', state.dailyReminder ? 1 : 0);
  dal.updatePreference('weekly_report', state.weeklyReport ? 1 : 0);

  // Overall balance
  const overallNum = parseFloat(state.overallBalance);
  if (!isNaN(overallNum)) {
    dal.updatePreference('overall_balance', overallNum);
  }

  // Monthly budget → monthly_budgets table
  if (state.monthlyBudget > 0) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    dal.setMonthlyBudget(currentMonth, state.monthlyBudget);
  }

  // Accounts — apply overallBalance to first account if set
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

  // Recurring payments (store as JSON in legacy settings for now)
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

  // Selected categories list (for reference, legacy settings)
  dal.setSetting('selectedCategories', JSON.stringify(state.selectedCategories));
}
