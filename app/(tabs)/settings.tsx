import { authClient } from '@/lib/auth-client';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { CURRENCIES } from '@/lib/utils/currency';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { deleteAccount } from '@/lib/account/deleteAccount';
import { requestNotificationPermission, scheduleDailyReminder, cancelAllNotifications } from '@/lib/utils/notifications';
import * as dal from '@/lib/dal';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SettingRow = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
};

const STATIC_GENERAL_SETTINGS: SettingRow[] = [
  { icon: 'globe', label: 'Language', value: 'English' },
  { icon: 'lock', label: 'Passcode Lock', toggle: true },
];

const DATA_SETTINGS: SettingRow[] = [
  { icon: 'download-cloud', label: 'Export Data', value: 'CSV' },
  { icon: 'upload-cloud', label: 'Backup', value: 'Auto' },
  { icon: 'refresh-cw', label: 'Sync', value: 'On' },
];

const ABOUT_SETTINGS: SettingRow[] = [
  { icon: 'help-circle', label: 'Help & Support' },
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

function SettingGroup({
  title,
  items,
}: {
  title: string;
  items: SettingRow[];
}) {
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
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const currency = useSettingsStore((s) => s.currency);
  const currencyInfo = CURRENCIES[currency];
  const currencyLabel = currencyInfo
    ? `${currencyInfo.code} (${currencyInfo.symbol})`
    : currency;

  const trackIncome = useSettingsStore((s) => s.trackIncome);
  const setTrackIncome = useSettingsStore((s) => s.setTrackIncome);

  // Read notification preference from DB
  const pref = dal.getUserPreferences();
  const [notificationsOn, setNotificationsOn] = useState(pref?.notifications_enabled === 1);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (granted) {
        dal.updatePreference('notifications_enabled', 1);
        setNotificationsOn(true);
        // Re-schedule based on saved daily/weekly preferences
        const p = dal.getUserPreferences();
        void scheduleDailyReminder(p?.daily_reminder === 1);
      } else {
        Alert.alert(
          'Notifications Blocked',
          'Please enable notifications for Pennify in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } else {
      dal.updatePreference('notifications_enabled', 0);
      setNotificationsOn(false);
      void cancelAllNotifications();
    }
  };

  const userName = session?.user?.name ?? 'Pennify User';
  const userEmail = session?.user?.email ?? 'Synced to cloud';

  const generalSettings: SettingRow[] = [
    {
      icon: 'dollar-sign',
      label: 'Currency',
      value: currencyLabel,
      onPress: () => router.push('/currency-picker'),
    },
    {
      icon: 'trending-up',
      label: 'Track Income',
      toggle: true,
      toggleValue: trackIncome,
      onToggle: setTrackIncome,
    },
    {
      icon: 'bell',
      label: 'Notifications',
      toggle: true,
      toggleValue: notificationsOn,
      onToggle: handleToggleNotifications,
    },
    ...STATIC_GENERAL_SETTINGS,
  ];

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    void authClient.signOut();
    router.replace('/sign-in');
  };

  const handleDeleteAccount = async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    setIsDeleting(true);
    try {
      await deleteAccount(userId);
      router.replace('/onboarding');
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
      contentContainerStyle={{ paddingTop: insets.top }}
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

      {/* Subscription Banner */}
      <View className='mx-6 mt-4 bg-black rounded-2xl p-5 flex-row items-center justify-between'>
        <View className='flex-row items-center gap-3'>
          <View className='w-10 h-10 rounded-xl bg-white/15 items-center justify-center'>
            <Feather name='zap' size={18} color='#fff' />
          </View>
          <View>
            <Text className='text-white font-bold text-[14px]'>
              Upgrade to Pro
            </Text>
            <Text className='text-neutral-500 text-[12px] mt-0.5'>
              Unlimited budgets & insights
            </Text>
          </View>
        </View>
        <Pressable className='bg-white rounded-full px-4 py-2'>
          <Text className='text-black text-[12px] font-bold'>Go Pro</Text>
        </Pressable>
      </View>

      <SettingGroup title='General' items={generalSettings} />
      <SettingGroup title='Data' items={DATA_SETTINGS} />
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
