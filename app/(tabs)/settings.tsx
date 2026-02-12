import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SettingRow = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value?: string;
  toggle?: boolean;
};

const GENERAL_SETTINGS: SettingRow[] = [
  { icon: 'dollar-sign', label: 'Currency', value: 'INR (₹)' },
  { icon: 'globe', label: 'Language', value: 'English' },
  { icon: 'bell', label: 'Notifications', toggle: true },
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
  const [enabled, setEnabled] = useState(true);

  return (
    <Pressable
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
          onValueChange={setEnabled}
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
          <Text className='text-[16px] font-bold text-black'>Harsh Rawat</Text>
          <Text className='text-[13px] text-neutral-400 mt-0.5'>
            harsh@example.com
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

      <SettingGroup title='General' items={GENERAL_SETTINGS} />
      <SettingGroup title='Data' items={DATA_SETTINGS} />
      <SettingGroup title='About' items={ABOUT_SETTINGS} />

      {/* Logout */}
      <View className='mx-6 mt-6'>
        <Pressable className='bg-white rounded-2xl py-4 items-center'>
          <Text className='text-red-500 font-semibold text-[14px]'>
            Log Out
          </Text>
        </Pressable>
      </View>

      <View className='h-32' />
    </ScrollView>
  );
}
