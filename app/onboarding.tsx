import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { StepPager } from '@/components/onboarding/StepPager';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { GetStarted } from '@/components/onboarding/GetStarted';
import { ChooseCurrency } from '@/components/onboarding/ChooseCurrency';
import { AddAccounts } from '@/components/onboarding/AddAccounts';
import { AddBalance } from '@/components/onboarding/AddBalance';
import { SetBudget } from '@/components/onboarding/SetBudget';
import { TrackIncome } from '@/components/onboarding/TrackIncome';
import { ChooseCategories } from '@/components/onboarding/ChooseCategories';
import { RecurringPayments } from '@/components/onboarding/RecurringPayments';
import { SetGoals } from '@/components/onboarding/SetGoals';
import { Notifications } from '@/components/onboarding/Notifications';
import { Motivational } from '@/components/onboarding/Motivational';
import { commitOnboarding } from '@/lib/onboarding/commitOnboarding';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';

const TOTAL_STEPS = 11;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const setHasOnboarded = useSettingsStore((s) => s.setHasOnboarded);

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    }
  }, [step]);

  const back = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const skipBalance = useCallback(() => {
    // Skip overall balance screen → go to next
    setStep((s) => s + 1);
  }, []);

  const finish = useCallback(() => {
    commitOnboarding();
    setHasOnboarded('pending_auth');
    router.replace('/sign-in?fromOnboarding=true');
  }, [setHasOnboarded]);

  const goToSignIn = useCallback(() => {
    // "Already have an account?" — skip onboarding entirely
    router.replace('/sign-in');
  }, []);

  // Screen 1 (GetStarted) is full black, no progress bar
  if (step === 0) {
    return (
      <>
        <GetStarted onNext={next} onSignIn={goToSignIn} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <View className="pt-4 pb-4">
        <ProgressBar current={step - 1} total={TOTAL_STEPS - 1} />
      </View>

      <StepPager step={step}>
        {/* index 0 placeholder — GetStarted is handled above */}
        <View />
        <ChooseCurrency onNext={next} onBack={back} />
        <AddAccounts onNext={next} onBack={back} />
        <AddBalance onNext={next} onBack={back} onSkip={skipBalance} />
        <SetBudget onNext={next} onBack={back} />
        <TrackIncome onNext={next} onBack={back} />
        <ChooseCategories onNext={next} onBack={back} />
        <RecurringPayments onNext={next} onBack={back} />
        <SetGoals onNext={next} onBack={back} />
        <Notifications onNext={next} onBack={back} />
        <Motivational onFinish={finish} onBack={back} />
      </StepPager>

      <StatusBar style="dark" />
    </View>
  );
}
