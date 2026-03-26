import { authClient } from '@/lib/auth-client';
import { useAuthenticatedUserId } from '@/lib/hooks/useAuthenticatedUserId';
import Purchases from 'react-native-purchases';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { CURRENCIES } from '@/lib/utils/currency';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { deleteAccount } from '@/lib/account/deleteAccount';
import { requestNotificationPermission, scheduleDailyReminder, cancelAllNotifications } from '@/lib/utils/notifications';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
type SettingRow = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
};


const ABOUT_SETTINGS: SettingRow[] = [
  { icon: 'help-circle', label: 'Help & Support', onPress: () => router.push('/help-support') },
  { icon: 'star', label: 'Rate the App' },
  { icon: 'info', label: 'Version', value: '1.0.0' },
];

function SettingItem({ item, isLast }: { item: SettingRow; isLast: boolean }) {
  const [localEnabled, setLocalEnabled] = useState(true);
  const isControlled = item.toggleValue !== undefined;
  const enabled = isControlled ? item.toggleValue : localEnabled;
  const handleToggle = (val: boolean) => {
    if (item.onToggle) item.onToggle(val);
    else setLocalEnabled(val);
  };

  return (
    <Pressable
      onPress={item.onPress}
      className={`flex-row items-center py-3.5 ${
        !isLast ? 'border-b border-neutral-100' : ''
      }`}
    >
      <View className='w-9 h-9 rounded-xl bg-neutral-100 items-center justify-center'>
        <Feather name={item.icon} size={16} color='#000' />
      </View>
      <Text className='flex-1 text-[14px] text-black ml-3 font-medium'>
        {item.label}
      </Text>
      {item.toggle ? (
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: '#E5E5E5', true: '#000000' }}
          thumbColor='#FFFFFF'
        />
      ) : item.value ? (
        <View className='flex-row items-center gap-1.5'>
          <Text className='text-[13px] text-neutral-400'>{item.value}</Text>
          <Feather name='chevron-right' size={14} color='#D4D4D4' />
        </View>
      ) : (
        <Feather name='chevron-right' size={16} color='#D4D4D4' />
      )}
    </Pressable>
  );
}

function SettingGroup({ title, items }: { title: string; items: SettingRow[] }) {
  return (
    <View className='mx-6 mt-6'>
      <Text className='text-[12px] text-neutral-400 font-semibold uppercase tracking-wider mb-2 ml-1'>
        {title}
      </Text>
      <View className='bg-white rounded-2xl px-4'>
        {items.map((item, i) => (
          <SettingItem
            key={item.label}
            item={item}
            isLast={i === items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const authenticatedUserId = useAuthenticatedUserId();

  const prefs = useQuery(api.preferences.get, authenticatedUserId ? { userId: authenticatedUserId } : 'skip');
  const updateCurrency = useMutation(api.preferences.updateCurrency);
  const updateTrackIncome = useMutation(api.preferences.updateTrackIncome);
  const updateNotifications = useMutation(api.preferences.updateNotifications);

  const currency = prefs?.currency ?? 'INR';
  const trackIncome = prefs?.trackIncome ?? true;
  const notificationsOn = prefs?.notificationsEnabled ?? false;

  const currencyInfo = CURRENCIES[currency];
  const currencyLabel = currencyInfo
    ? `${currencyInfo.code} (${currencyInfo.symbol})`
    : currency;

  const handleSetCurrency = async (code: string) => {
    if (!userId) return;
    await updateCurrency({ userId, currency: code });
  };

  const handleToggleTrackIncome = async (value: boolean) => {
    if (!userId) return;
    await updateTrackIncome({ userId, trackIncome: value });
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!userId) return;
    if (value) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await updateNotifications({ userId, notificationsEnabled: true });
        void scheduleDailyReminder(prefs?.dailyReminder ?? true);
      } else {
        Alert.alert(
          'Notifications Blocked',
          'Please enable notifications for Spendler in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } else {
      await updateNotifications({ userId, notificationsEnabled: false });
      void cancelAllNotifications();
    }
  };

  const userName = session?.user?.name ?? 'Spendler User';
  const userEmail = session?.user?.email ?? 'Synced to cloud';

  const generalSettings: SettingRow[] = [
    {
      icon: 'zap',
      label: 'Ask Penny',
      onPress: () => router.push('/finance-chat'),
    },
    {
      icon: 'award',
      label: 'Plans & Pricing',
      onPress: () => router.push('/paywall'),
    },
    ...(prefs?.subscriptionStatus === 'monthly' || prefs?.subscriptionStatus === 'yearly'
      ? [{
          icon: 'award' as const,
          label: 'Manage Subscription',
          onPress: () => Linking.openURL('https://apps.apple.com/account/subscriptions'),
        }]
      : []),
    {
      icon: 'users',
      label: 'People & Debts',
      onPress: () => router.push('/people'),
    },
    {
      icon: 'dollar-sign',
      label: 'Currency',
      value: currencyLabel,
      onPress: () => router.push('/currency-picker'),
    },
    {
      icon: 'credit-card',
      label: 'Accounts',
      onPress: () => router.push('/accounts'),
    },
    {
      icon: 'repeat',
      label: 'Subscriptions',
      onPress: () => router.push('/subscriptions'),
    },
    {
      icon: 'tag',
      label: 'Categories',
      onPress: () => router.push('/categories'),
    },
    {
      icon: 'sliders',
      label: 'Monthly Budget',
      onPress: () => router.push('/monthly-budget'),
    },
    {
      icon: 'zap',
      label: 'Smart Rules',
      onPress: () => router.push('/smart-rules'),
    },
    {
      icon: 'trending-up',
      label: 'Track Income',
      toggle: true,
      toggleValue: trackIncome,
      onToggle: handleToggleTrackIncome,
    },
    {
      icon: 'bell',
      label: 'Notifications',
      toggle: true,
      toggleValue: notificationsOn,
      onToggle: handleToggleNotifications,
    },
  ];

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    void Purchases.logOut().catch(() => {});
    void authClient.signOut();
    router.replace('/sign-in');
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setIsDeleting(true);
    try {
      await deleteAccount(userId);
      router.replace('/sign-in');
    } catch (e) {
      console.error('[Settings] Delete account failed:', e);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <ScrollView
      className='flex-1 bg-neutral-50'
      contentContainerStyle={{}}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className='px-6 pt-4 pb-2'>
        <Text className='text-[22px] font-bold text-black tracking-tight'>
          Settings
        </Text>
      </View>

      {/* Profile Card */}
      <View className='mx-6 mt-3 bg-white rounded-2xl p-5 flex-row items-center'>
        <View className='w-14 h-14 rounded-full bg-black items-center justify-center'>
          <Feather name='user' size={22} color='#fff' />
        </View>
        <View className='flex-1 ml-4'>
          <Text className='text-[16px] font-bold text-black'>{userName}</Text>
          <Text className='text-[13px] text-neutral-400 mt-0.5'>
            {userEmail}
          </Text>
        </View>
        <Pressable>
          <Feather name='chevron-right' size={18} color='#D4D4D4' />
        </Pressable>
      </View>

      {/* Subscription Banner — hidden for yearly, upgrade prompt for monthly, go pro for none/expired */}
      {prefs?.subscriptionStatus !== 'yearly' && (
        <Pressable
          onPress={() => router.push('/paywall')}
          className='mx-6 mt-4 bg-black rounded-2xl p-5 flex-row items-center justify-between'
        >
          <View className='flex-row items-center gap-3'>
            <View className='w-10 h-10 rounded-xl bg-white/15 items-center justify-center'>
              <Feather name='zap' size={18} color='#fff' />
            </View>
            <View>
              <Text className='text-white font-bold text-[14px]'>
                {prefs?.subscriptionStatus === 'monthly'
                  ? 'Switch to Yearly'
                  : 'Upgrade to Pro'}
              </Text>
              <Text className='text-neutral-500 text-[12px] mt-0.5'>
                {prefs?.subscriptionStatus === 'monthly'
                  ? 'Save 33% with an annual plan'
                  : 'Unlimited budgets & insights'}
              </Text>
            </View>
          </View>
          <View className='bg-white rounded-full px-4 py-2'>
            <Text className='text-black text-[12px] font-bold'>
              {prefs?.subscriptionStatus === 'monthly' ? 'Save 33%' : 'Go Pro'}
            </Text>
          </View>
        </Pressable>
      )}

      <SettingGroup title='General' items={generalSettings} />
      <SettingGroup title='About' items={ABOUT_SETTINGS} />

      {/* Logout */}
      <View className='mx-6 mt-6'>
        <Pressable
          onPress={handleLogout}
          className='bg-white rounded-2xl py-4 items-center'
        >
          <Text className='text-red-500 font-semibold text-[14px]'>
            Log Out
          </Text>
        </Pressable>
      </View>

      {/* Delete Account */}
      <View className='mx-6 mt-3'>
        <Pressable
          onPress={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
          className='bg-white rounded-2xl py-4 items-center flex-row justify-center gap-2'
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : null}
          <Text className='text-red-500 font-semibold text-[14px]'>
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </Pressable>
      </View>

      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Delete Account"
        message="This will permanently delete your account and all your data. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep Account"
        destructive
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <View className='h-32' />
    </ScrollView>
  );
}
