import { GetStarted } from '@/components/onboarding/GetStarted';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';

export default function WelcomeScreen() {
  const onNext = useCallback(() => {
    router.replace('/onboarding');
  }, []);

  const onSignIn = useCallback(() => {
    router.replace('/sign-in');
  }, []);

  return (
    <>
      <GetStarted onNext={onNext} onSignIn={onSignIn} />
      <StatusBar style='light' />
    </>
  );
}
