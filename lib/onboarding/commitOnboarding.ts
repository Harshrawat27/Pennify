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

  // Accounts
  for (const acc of state.accounts) {
    dal.createAccount({
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      icon: acc.icon,
    });
  }

  // Categories: ensure selected categories exist, add custom ones
  const existingCategories = dal.getAllCategories();
  const existingNames = new Set(existingCategories.map((c) => c.name));

  for (const name of state.customCategories) {
    if (!existingNames.has(name)) {
      dal.createCategory({
        name,
        icon: 'tag',
        type: 'expense',
        color: '#525252',
      });
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
