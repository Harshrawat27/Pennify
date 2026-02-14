import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { StepPager } from '@/components/onboarding/StepPager';
import { TryFree } from '@/components/onboarding/TryFree';
import { SubscriptionPlans } from '@/components/onboarding/SubscriptionPlans';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';

export default function PostAuthSetupScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const setHasOnboarded = useSettingsStore((s) => s.setHasOnboarded);

  const next = useCallback(() => {
    setStep(1);
  }, []);

  const finish = useCallback(() => {
    setHasOnboarded('true');
    router.replace('/(tabs)');
  }, [setHasOnboarded]);

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <StepPager step={step}>
        <TryFree onNext={next} />
        <SubscriptionPlans onFinish={finish} />
      </StepPager>
      <StatusBar style="dark" />
    </View>
  );
}
