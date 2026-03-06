import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { StepPager } from '@/components/onboarding/StepPager';
import { TryFree } from '@/components/onboarding/TryFree';
import { SubscriptionPlans } from '@/components/onboarding/SubscriptionPlans';
export default function PostAuthSetupScreen() {
  const [step, setStep] = useState(0);

  const next = useCallback(() => {
    setStep(1);
  }, []);

  const finish = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  return (
    <View className="flex-1 bg-neutral-50">
      <StepPager step={step}>
        <TryFree onNext={next} />
        <SubscriptionPlans onFinish={finish} />
      </StepPager>
      <StatusBar style="dark" />
    </View>
  );
}
