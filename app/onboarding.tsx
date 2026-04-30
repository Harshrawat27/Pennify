import * as StoreReview from 'expo-store-review';
import { AddAccounts } from '@/components/onboarding/AddAccounts';
import { AddBalance } from '@/components/onboarding/AddBalance';
import { CategoryBudgets } from '@/components/onboarding/CategoryBudgets';
import { ChooseCategories } from '@/components/onboarding/ChooseCategories';
import { ChooseCurrency } from '@/components/onboarding/ChooseCurrency';
import { Motivational } from '@/components/onboarding/Motivational';
import { Notifications } from '@/components/onboarding/Notifications';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { RecurringPayments } from '@/components/onboarding/RecurringPayments';
import { SetBudget } from '@/components/onboarding/SetBudget';
import { SetGoals } from '@/components/onboarding/SetGoals';
import { SmartRules } from '@/components/onboarding/SmartRules';
import { StepPager } from '@/components/onboarding/StepPager';
import { TrackIncome } from '@/components/onboarding/TrackIncome';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';
import { currentMonth } from '@/lib/utils/date';
import {
  cancelAllNotifications,
  scheduleDailyReminder,
  scheduleWeeklyReport,
} from '@/lib/utils/notifications';
import { useAction, useMutation } from 'convex/react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

const TOTAL_STEPS = 12;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [isCommitting, setIsCommitting] = useState(false);

  const { data: session } = authClient.useSession();
  const commitAll = useMutation(api.onboarding.commitAll);
  const categorizePayment = useAction(api.categorize.categorizeRecurringPayment);

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    }
  }, [step]);

  const back = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      router.replace('/welcome');
    }
  }, [step]);

  const skipBalance = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  const finish = useCallback(async () => {
    if (!session?.user?.id) {
      // Not signed in yet — shouldn't happen in new flow (sign-in first)
      // but handle gracefully by going to sign-in
      router.replace('/sign-in');
      return;
    }

    const state = useOnboardingStore.getState();
    const overallNum = parseFloat(state.overallBalance);

    setIsCommitting(true);
    try {
      const result = await commitAll({
        userId: session.user.id,
        preferences: {
          currency: state.currency,
          overallBalance: isNaN(overallNum) ? 0 : overallNum,
          trackIncome: state.trackIncome,
          notificationsEnabled: state.notificationsEnabled,
          dailyReminder: state.dailyReminder,
          weeklyReport: state.weeklyReport,
        },
        accounts: state.accounts.map((acc) => ({
          name: acc.name,
          type: acc.type,
          icon: acc.icon as string,
        })),
        customCategories: state.customCategories.map((c) => ({
          name: c.name,
          parentCategory: c.parentCategory,
        })),
        goals: state.goals
          .map((g) => ({
            name: g.name,
            icon: g.icon as string,
            target: parseFloat(g.target),
            color: g.color,
          }))
          .filter((g) => !isNaN(g.target) && g.target > 0),
        recurringPayments: state.recurringPayments
          .map((p) => ({
            name: p.name,
            amount: parseFloat(p.amount),
            frequency: p.frequency,
            billingDay: p.billingDay,
            purchasedAt: p.purchasedAt,
          }))
          .filter((p) => !isNaN(p.amount) && p.amount > 0),
        monthlyBudget:
          state.monthlyBudget > 0
            ? { month: currentMonth(), budget: state.monthlyBudget }
            : undefined,
        smartRules: state.smartRules.length > 0 ? state.smartRules : undefined,
        categoryBudgets: state.categoryBudgets.length > 0
          ? state.categoryBudgets.map((b) => ({ parentCategoryName: b.parentCategoryName, limitAmount: b.limitAmount }))
          : undefined,
      });

      // Fire-and-forget AI categorization for each recurring payment
      for (const { id, name } of result?.recurringPayments ?? []) {
        void categorizePayment({ userId: session.user.id, recurringPaymentId: id, name });
      }

      // Schedule notifications
      if (state.notificationsEnabled) {
        void scheduleDailyReminder(state.dailyReminder);
        void scheduleWeeklyReport(state.weeklyReport);
      } else {
        void cancelAllNotifications();
      }

      // Reset onboarding store
      useOnboardingStore.getState().reset();

      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }

      router.replace('/paywall');
    } catch (e) {
      console.error('[Onboarding] commitAll failed:', e);
      setIsCommitting(false);
    }
  }, [session, commitAll, categorizePayment]);

  if (isCommitting) {
    return (
      <View className='flex-1 bg-black items-center justify-center'>
        <ActivityIndicator size='large' color='#ffffff' />
        <Text className='text-neutral-500 text-[14px] mt-4'>
          Setting up your account…
        </Text>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-neutral-50'>
      <View className='pt-4 pb-4'>
        <ProgressBar current={step} total={TOTAL_STEPS - 1} />
      </View>

      <StepPager step={step}>
        <ChooseCurrency onNext={next} onBack={back} />
        <AddAccounts onNext={next} onBack={back} />
        <AddBalance onNext={next} onBack={back} onSkip={skipBalance} />
        <SetBudget onNext={next} onBack={back} />
        <CategoryBudgets onNext={next} onBack={back} />
        <TrackIncome onNext={next} onBack={back} />
        <ChooseCategories onNext={next} onBack={back} />
        <SmartRules onNext={next} onBack={back} />
        <RecurringPayments onNext={next} onBack={back} />
        <SetGoals onNext={next} onBack={back} />
        <Notifications onNext={next} onBack={back} />
        <Motivational onFinish={finish} onBack={back} />
      </StepPager>

      <StatusBar style='dark' />
    </View>
  );
}
