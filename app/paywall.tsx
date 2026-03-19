import { deleteAccount } from '@/lib/account/deleteAccount';
import { authClient } from '@/lib/auth-client';
import { Feather } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
    description: null,
  },
];

const MONTHLY_FEATURES = [
  'Unlimited budgets & saving goals',
  'AI-powered expense insights',
  'Monthly & yearly reports',
  'Multi-account support',
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const navigation = useNavigation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>(
    'yearly'
  );

  // Cross-fade animation
  const yearlyOpacity = useRef(new Animated.Value(1)).current;
  const monthlyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedPlan === 'yearly') {
      Animated.parallel([
        Animated.timing(monthlyOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(yearlyOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(yearlyOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(monthlyOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedPlan]);

  // Billing date = 3 days from today
  const billingDate = new Date();
  billingDate.setDate(billingDate.getDate() + 3);
  const billingDateStr = billingDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  function handleMaybeLater() {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  function handlePurchase() {
    Alert.alert('Coming Soon', 'In-app purchases will be available soon.', [
      { text: 'OK' },
    ]);
  }

  function handleRestore() {
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
        {/* Title — fixed height, both titles stacked, cross-fade */}
        <View style={{ height: 88, marginTop: 20, paddingHorizontal: 24 }}>
          {/* Yearly title */}
          <Animated.View
            style={{
              position: 'absolute',
              left: 24,
              right: 24,
              opacity: yearlyOpacity,
            }}
          >
            <Text className='text-[30px] font-extrabold text-black text-center leading-9'>
              Start your 3-day{'\n'}FREE trial to continue.
            </Text>
          </Animated.View>
          {/* Monthly title */}
          <Animated.View
            style={{
              position: 'absolute',
              left: 24,
              right: 24,
              opacity: monthlyOpacity,
            }}
          >
            <Text className='text-[30px] font-extrabold text-black text-center leading-9'>
              Subscribe to{'\n'}continue.
            </Text>
          </Animated.View>
        </View>

        {/* Middle content — fixed height, cross-fade between timeline and features */}
        <View style={{ height: 250, marginTop: 24, marginHorizontal: 24 }}>
          {/* Yearly: timeline */}
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              opacity: yearlyOpacity,
            }}
          >
            {TIMELINE_STEPS.map((step, i) => {
              const isLast = i === TIMELINE_STEPS.length - 1;
              const description =
                step.description ??
                `You'll be charged on ${billingDateStr} unless you cancel anytime before.`;
              return (
                <View key={i} className='flex-row gap-4'>
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
          </Animated.View>

          {/* Monthly: feature list */}
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              opacity: monthlyOpacity,
            }}
          >
            <View className='bg-neutral-50 rounded-2xl p-5'>
              {MONTHLY_FEATURES.map((f, i) => (
                <View
                  key={i}
                  className={`flex-row items-center gap-3 ${i > 0 ? 'mt-3' : ''}`}
                >
                  <View className='w-5 h-5 rounded-full bg-black items-center justify-center'>
                    <Feather name='check' size={11} color='#fff' />
                  </View>
                  <Text className='text-[14px] text-black font-medium'>
                    {f}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Plan cards */}
        <View className='flex-row mx-5 mt-2 gap-3'>
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

        {/* No payment due — fixed height to avoid jump */}
        <View
          style={{
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 12,
          }}
        >
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              opacity: yearlyOpacity,
            }}
          >
            <Feather name='check' size={14} color='#000' />
            <Text className='text-[14px] font-semibold text-black'>
              No Payment Due Now
            </Text>
          </Animated.View>
        </View>

        {/* CTA Button */}
        <Pressable
          onPress={handlePurchase}
          className='mx-5 bg-black rounded-2xl mt-3'
          style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}
        >
          <Animated.Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '700',
              opacity: yearlyOpacity,
              position: 'absolute',
            }}
          >
            Start My 3-Day Free Trial
          </Animated.Text>
          <Animated.Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '700',
              opacity: monthlyOpacity,
              position: 'absolute',
            }}
          >
            Subscribe Monthly · $9.99
          </Animated.Text>
        </Pressable>

        {/* Legal — fixed height */}
        <View
          style={{
            height: 36,
            marginTop: 8,
            paddingHorizontal: 32,
            justifyContent: 'center',
          }}
        >
          <Animated.Text
            style={{
              color: '#a3a3a3',
              fontSize: 11,
              textAlign: 'center',
              lineHeight: 16,
              opacity: yearlyOpacity,
              position: 'absolute',
              left: 32,
              right: 32,
            }}
          >
            3 days free, then $29.99 per year ($2.50/mo). Cancel anytime before{' '}
            {billingDateStr}.
          </Animated.Text>
          <Animated.Text
            style={{
              color: '#a3a3a3',
              fontSize: 11,
              textAlign: 'center',
              lineHeight: 16,
              opacity: monthlyOpacity,
              position: 'absolute',
              left: 32,
              right: 32,
            }}
          >
            $9.99/month. Auto-renews unless cancelled 24 hours before renewal.
          </Animated.Text>
        </View>

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
