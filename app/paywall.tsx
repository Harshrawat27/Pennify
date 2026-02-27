import { authClient } from '@/lib/auth-client';
import { deleteAccount } from '@/lib/account/deleteAccount';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FEATURES = [
  { icon: 'trending-up', label: 'Track income & expenses' },
  { icon: 'target', label: 'Unlimited saving goals' },
  { icon: 'bar-chart-2', label: 'Monthly & yearly reports' },
  { icon: 'layers', label: 'Multi-account support' },
  { icon: 'zap', label: 'AI-powered insights' },
];

// TODO: Update prices before launch
const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '₹299',
    period: '/month',
    badge: null,
    description: 'Billed monthly',
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '₹1,999',
    period: '/year',
    badge: 'Save 44%',
    description: 'Billed annually · ₹167/mo',
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  function handlePurchase(planId: string) {
    // TODO: Integrate RevenueCat purchase here
    Alert.alert(
      'Coming Soon',
      'In-app purchases will be available soon. Please check back after the app launches on the App Store.',
      [{ text: 'OK' }]
    );
  }

  function handleRestore() {
    // TODO: Integrate RevenueCat restore here
    Alert.alert(
      'Restore Purchase',
      'Purchase restoration will be available once the app launches on the App Store.',
      [{ text: 'OK' }]
    );
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authClient.signOut();
          router.replace('/sign-in');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            const userId = session?.user?.id;
            if (!userId) return;
            setIsDeleting(true);
            try {
              await deleteAccount(userId);
              router.replace('/sign-in');
            } catch (e) {
              console.error('[Paywall] Delete account failed:', e);
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (isDeleting) {
    return (
      <View className='flex-1 bg-black items-center justify-center'>
        <ActivityIndicator size='large' color='#ffffff' />
        <Text className='text-neutral-500 text-[14px] mt-4'>Deleting account…</Text>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-black' style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Header */}
        <View className='items-center pt-10 pb-8 px-6'>
          <View className='w-16 h-16 rounded-2xl bg-white items-center justify-center mb-5'>
            <Feather name='trending-up' size={30} color='#000' />
          </View>
          <Text className='text-white text-[28px] font-bold tracking-tight text-center'>
            Pennify Premium
          </Text>
          <Text className='text-neutral-400 text-[15px] mt-2 text-center leading-5'>
            Everything you need to master your finances
          </Text>
        </View>

        {/* Features */}
        <View className='mx-6 bg-white/5 rounded-2xl p-5 mb-8'>
          {FEATURES.map((f, i) => (
            <View
              key={f.icon}
              className={`flex-row items-center gap-3 ${i > 0 ? 'mt-3.5' : ''}`}
            >
              <View className='w-8 h-8 rounded-xl bg-white/10 items-center justify-center'>
                <Feather name={f.icon as any} size={15} color='#fff' />
              </View>
              <Text className='text-white text-[14px] font-medium'>{f.label}</Text>
              <Feather
                name='check'
                size={14}
                color='#22c55e'
                style={{ marginLeft: 'auto' }}
              />
            </View>
          ))}
        </View>

        {/* Plans */}
        <View className='mx-6 gap-3'>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => handlePurchase(plan.id)}
              className='bg-white rounded-2xl p-5'
            >
              <View className='flex-row items-center justify-between'>
                <View>
                  <View className='flex-row items-center gap-2'>
                    <Text className='text-black text-[16px] font-bold'>
                      {plan.label}
                    </Text>
                    {plan.badge && (
                      <View className='bg-black rounded-full px-2.5 py-0.5'>
                        <Text className='text-white text-[11px] font-bold'>
                          {plan.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className='text-neutral-400 text-[12px] mt-0.5'>
                    {plan.description}
                  </Text>
                </View>
                <View className='items-end'>
                  <View className='flex-row items-baseline gap-0.5'>
                    <Text className='text-black text-[22px] font-bold'>
                      {plan.price}
                    </Text>
                    <Text className='text-neutral-400 text-[13px]'>
                      {plan.period}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Restore & Sign out */}
        <View className='items-center mt-8 gap-4'>
          <Pressable onPress={handleRestore}>
            <Text className='text-neutral-500 text-[13px] font-medium'>
              Restore Purchase
            </Text>
          </Pressable>
          <Pressable onPress={handleSignOut}>
            <Text className='text-neutral-600 text-[12px]'>Sign out</Text>
          </Pressable>
          <Pressable onPress={handleDeleteAccount}>
            <Text className='text-red-800 text-[12px]'>Delete Account</Text>
          </Pressable>
        </View>

        {/* Legal */}
        <Text className='text-neutral-700 text-[11px] text-center mx-8 mt-6 leading-4'>
          Subscriptions auto-renew unless cancelled at least 24 hours before the
          renewal date. Manage or cancel in your App Store settings.
        </Text>
      </ScrollView>
    </View>
  );
}
