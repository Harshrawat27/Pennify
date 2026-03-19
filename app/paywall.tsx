import { deleteAccount } from '@/lib/account/deleteAccount';
import { authClient } from '@/lib/auth-client';
import { Feather } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TIMELINE_STEPS = [
  {
    icon: 'unlock',
    color: '#F97316',
    title: 'Today',
    description: 'Unlock all features — budgets, AI insights, reports & more.',
  },
  {
    icon: 'bell',
    color: '#F97316',
    title: 'In 2 Days — Reminder',
    description: "We'll send you a reminder that your trial is ending soon.",
  },
  {
    icon: 'award',
    color: '#000',
    title: 'In 3 Days — Billing Starts',
    description: null, // computed dynamically
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const navigation = useNavigation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>(
    'yearly'
  );

  // Billing date = 3 days from today
  const billingDate = new Date();
  billingDate.setDate(billingDate.getDate() + 3);
  const billingDateStr = billingDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  function handleMaybeLater() {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  function handlePurchase() {
    // TODO: Integrate RevenueCat purchase here
    Alert.alert('Coming Soon', 'In-app purchases will be available soon.', [
      { text: 'OK' },
    ]);
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
      <View className='flex-1 bg-white items-center justify-center'>
        <ActivityIndicator size='large' color='#000' />
        <Text className='text-neutral-500 text-[14px] mt-4'>
          Deleting account…
        </Text>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-white'>
      {/* Header */}
      <View className='flex-row items-center justify-between px-5 pt-4 pb-2'>
        <Pressable
          onPress={handleMaybeLater}
          hitSlop={12}
          className='w-9 h-9 items-center justify-center'
        >
          <Feather name='chevron-left' size={24} color='#000' />
        </Pressable>
        <Pressable onPress={handleRestore} hitSlop={12}>
          <Text className='text-[15px] text-neutral-500'>Restore</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Logo */}
        {/* <View className='items-center mt-4'>
          <Image
            source={require('../assets/images/icon.png')}
            style={{ width: 56, height: 56, borderRadius: 14 }}
            resizeMode='cover'
          />
        </View> */}

        {/* Title */}
        <View className='px-6 mt-5'>
          {selectedPlan === 'yearly' ? (
            <Text className='text-[30px] font-extrabold text-black text-center leading-9'>
              Start your 3-day{'\n'}
              <Text className='text-black'>FREE trial</Text> to continue.
            </Text>
          ) : (
            <Text className='text-[30px] font-extrabold text-black text-center leading-9'>
              Subscribe to{'\n'}continue.
            </Text>
          )}
        </View>

        {/* Timeline — only for yearly */}
        {selectedPlan === 'yearly' ? (
          <View className='mx-6 mt-8'>
            {TIMELINE_STEPS.map((step, i) => {
              const isLast = i === TIMELINE_STEPS.length - 1;
              const description =
                step.description ??
                `You'll be charged on ${billingDateStr} unless you cancel anytime before.`;
              return (
                <View key={i} className='flex-row gap-4'>
                  {/* Icon + connector line */}
                  <View className='items-center' style={{ width: 44 }}>
                    <View
                      style={{ backgroundColor: step.color }}
                      className='w-11 h-11 rounded-full items-center justify-center'
                    >
                      <Feather name={step.icon as any} size={19} color='#fff' />
                    </View>
                    {!isLast && (
                      <View
                        style={{
                          width: 3,
                          flex: 1,
                          minHeight: 36,
                          backgroundColor: i === 1 ? '#D4D4D4' : '#F97316',
                          opacity: i === 1 ? 1 : 0.45,
                        }}
                      />
                    )}
                  </View>
                  {/* Text */}
                  <View className='flex-1 pb-6'>
                    <Text className='text-[16px] font-bold text-black'>
                      {step.title}
                    </Text>
                    <Text className='text-[13px] text-neutral-500 mt-1 leading-5'>
                      {description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* Monthly — show brief feature list instead */
          <View className='mx-6 mt-6 bg-neutral-50 rounded-2xl p-5'>
            {[
              'Unlimited budgets & saving goals',
              'AI-powered expense insights',
              'Monthly & yearly reports',
              'Multi-account support',
            ].map((f, i) => (
              <View
                key={i}
                className={`flex-row items-center gap-3 ${i > 0 ? 'mt-3' : ''}`}
              >
                <View className='w-5 h-5 rounded-full bg-black items-center justify-center'>
                  <Feather name='check' size={11} color='#fff' />
                </View>
                <Text className='text-[14px] text-black font-medium'>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Plan cards */}
        <View className='flex-row mx-5 mt-8 gap-3'>
          {/* Monthly */}
          <Pressable
            onPress={() => setSelectedPlan('monthly')}
            style={{
              flex: 1,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: selectedPlan === 'monthly' ? '#000' : '#E5E5E5',
              padding: 16,
              backgroundColor: '#fff',
            }}
          >
            <Text className='text-[14px] font-semibold text-black'>
              Monthly
            </Text>
            <Text className='text-[14px] font-bold text-black mt-1'>
              $9.99 /mo
            </Text>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                marginTop: 10,
                borderWidth: 2,
                borderColor: selectedPlan === 'monthly' ? '#000' : '#ccc',
                backgroundColor:
                  selectedPlan === 'monthly' ? '#000' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedPlan === 'monthly' && (
                <Feather name='check' size={12} color='#fff' />
              )}
            </View>
          </Pressable>

          {/* Yearly */}
          <Pressable
            onPress={() => setSelectedPlan('yearly')}
            style={{
              flex: 1,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: selectedPlan === 'yearly' ? '#000' : '#E5E5E5',
              padding: 16,
              backgroundColor: '#fff',
            }}
          >
            {/* "3 DAYS FREE" badge — absolutely positioned above the card */}
            <View
              style={{
                position: 'absolute',
                top: -13,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
            >
              <View className='bg-black rounded-full px-3 py-1'>
                <Text className='text-white text-[11px] font-bold tracking-wide'>
                  3 DAYS FREE
                </Text>
              </View>
            </View>
            <Text className='text-[14px] font-semibold text-black'>Yearly</Text>
            <Text className='text-[14px] font-bold text-black mt-1'>
              $2.50 /mo
            </Text>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                marginTop: 10,
                borderWidth: 2,
                borderColor: '#000',
                backgroundColor:
                  selectedPlan === 'yearly' ? '#000' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedPlan === 'yearly' && (
                <Feather name='check' size={12} color='#fff' />
              )}
            </View>
          </Pressable>
        </View>

        {/* No payment due now — yearly only */}
        {selectedPlan === 'yearly' && (
          <View className='flex-row items-center justify-center gap-2 mt-4'>
            <Feather name='check' size={14} color='#000' />
            <Text className='text-[14px] font-semibold text-black'>
              No Payment Due Now
            </Text>
          </View>
        )}

        {/* CTA Button */}
        <Pressable
          onPress={handlePurchase}
          className='mx-5 bg-black rounded-2xl py-4 items-center mt-5'
        >
          <Text className='text-white text-[16px] font-bold'>
            {selectedPlan === 'yearly'
              ? 'Start My 3-Day Free Trial'
              : 'Subscribe Monthly · $9.99'}
          </Text>
        </Pressable>

        {/* Legal */}
        <Text className='text-neutral-400 text-[11px] text-center mx-8 mt-3 leading-4'>
          {selectedPlan === 'yearly'
            ? `3 days free, then $29.99 per year ($2.50/mo).`
            : '$9.99/month. Subscriptions auto-renew unless cancelled 24 hours before renewal.'}
        </Text>

        {/* Bottom links */}
        <View className='items-center mt-6 gap-3'>
          <Pressable onPress={handleSignOut}>
            <Text className='text-neutral-400 text-[12px]'>Sign out</Text>
          </Pressable>
          <Pressable onPress={handleDeleteAccount}>
            <Text className='text-red-400 text-[12px]'>Delete Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
