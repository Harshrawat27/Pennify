import { authClient } from '@/lib/auth-client';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('[SignIn] rendered — isLoading:', isLoading);

  const handleGoogleSignIn = async () => {
    console.log('[SignIn] button pressed');
    setError('');
    setIsLoading(true);
    try {
      console.log('[SignIn] calling authClient.signIn.social...');
      console.log('[SignIn] baseURL:', process.env.EXPO_PUBLIC_AUTH_URL);
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
      console.log('[SignIn] signIn.social returned:', JSON.stringify(result));
      console.log('[SignIn] result.error:', result?.error);
      console.log('[SignIn] result.data:', JSON.stringify(result?.data));
    } catch (e: unknown) {
      console.error('[SignIn] Google error:', e);
      console.error('[SignIn] Google error stringified:', JSON.stringify(e));
      setError('Google sign-in failed. Please try again.');
    } finally {
      console.log('[SignIn] finally — resetting isLoading');
      setIsLoading(false);
    }
  };

  return (
    <View
      className='flex-1 bg-black justify-between px-8'
      style={{ paddingBottom: insets.bottom + 40 }}
    >
      {/* Top: Branding */}
      <View className='items-center mt-20'>
        <Image
          source={require('@/assets/images/white-icon.png')}
          style={{ width: 80, height: 80, marginBottom: 24, borderRadius: 20 }}
          resizeMode='contain'
        />
        <Text className='text-white text-[32px] font-bold tracking-tight'>
          Spendler
        </Text>
        <Text className='text-neutral-500 text-[16px] mt-2 text-center leading-6'>
          Track your money.{'\n'}Build your future.
        </Text>
      </View>

      {/* Bottom: Google Sign In */}
      <View className='gap-4'>
        {error ? (
          <View className='bg-red-500/10 rounded-xl px-4 py-3'>
            <Text className='text-red-400 text-[13px] text-center'>
              {error}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          className='bg-white rounded-2xl py-4 flex-row items-center justify-center gap-3'
          style={({ pressed }) => ({
            opacity: pressed || isLoading ? 0.6 : 1,
          })}
        >
          {isLoading ? (
            <ActivityIndicator size='small' color='#000' />
          ) : (
            <Feather name='chrome' size={20} color='#000' />
          )}
          <Text className='text-black text-[16px] font-semibold'>
            {isLoading ? 'Please wait...' : 'Continue with Google'}
          </Text>
        </Pressable>

        <Text className='text-neutral-600 text-[12px] text-center leading-5'>
          By continuing, you agree to our{'\n'}
          <Text
            className='text-neutral-400 underline'
            onPress={() => Linking.openURL('https://spendler.app/terms')}
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            className='text-neutral-400 underline'
            onPress={() => Linking.openURL('https://spendler.app/privacy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>
    </View>
  );
}
