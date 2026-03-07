import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDateShort } from '@/lib/utils/date';
import { scheduleRecurringReminder, cancelRecurringReminder } from '@/lib/utils/notifications';
import { BillingDayPicker } from '@/components/BillingDayPicker';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FeatherIcon } from '@/lib/models/types';

const GOAL_ICONS: { icon: FeatherIcon; label: string }[] = [
  { icon: 'shield', label: 'Emergency' },
  { icon: 'heart', label: 'Health' },
  { icon: 'home', label: 'Home' },
  { icon: 'monitor', label: 'Tech' },
  { icon: 'map', label: 'Travel' },
  { icon: 'book', label: 'Education' },
  { icon: 'gift', label: 'Gift' },
  { icon: 'target', label: 'Other' },
];

const GOAL_COLORS = ['#000000', '#525252', '#A3A3A3', '#059669', '#2563EB', '#DC2626'];

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFreq, setNewFreq] = useState<'monthly' | 'yearly'>('monthly');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // Sinking fund options (only for yearly)
  const [isSinkingFund, setIsSinkingFund] = useState(false);
  const [goalIcon, setGoalIcon] = useState<FeatherIcon>('target');
  const [goalColor, setGoalColor] = useState('#000000');

  const payments = useQuery(api.recurring.list, userId ? { userId } : 'skip');
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');

  const createPayment = useMutation(api.recurring.create);
  const createLinkedSinkingFund = useMutation(api.recurring.createLinkedSinkingFund);
  const togglePause = useMutation(api.recurring.togglePause);
  const removePayment = useMutation(api.recurring.remove);

  const currency = prefs?.currency ?? 'INR';

  const active = (payments ?? []).filter((p) => !p.isPaused);
  const paused = (payments ?? []).filter((p) => p.isPaused);

  function resetModal() {
    setNewName('');
    setNewAmount('');
    setNewFreq('monthly');
    setIsSinkingFund(false);
    setGoalIcon('target');
    setGoalColor('#000000');
    setShowCalendar(false);
    setSelectedDate(null);
    setShowAdd(false);
  }

  async function handleAdd() {
    if (!userId || !newName.trim()) return;
    const amount = parseFloat(newAmount);
    if (!amount || amount <= 0) return;

    const billingDay = selectedDate ? Number(selectedDate.slice(8, 10)) : undefined;
    const purchasedAt = selectedDate ?? undefined;

    if (newFreq === 'yearly' && isSinkingFund) {
      await createLinkedSinkingFund({ userId, name: newName.trim(), amount, goalIcon, goalColor });
    } else {
      const id = await createPayment({ userId, name: newName.trim(), amount, frequency: newFreq, billingDay, purchasedAt });
      // Schedule local reminder notification 1 day before billing day
      if (billingDay && id) {
        void scheduleRecurringReminder(String(id), newName.trim(), billingDay);
      }
    }
    resetModal();
  }

  function handleDelete(payment: any) {
    Alert.alert(
      'Delete Subscription',
      payment.linkedGoalId
        ? `"${payment.name}" will be deleted. The linked savings goal will remain but won't auto-pay anymore.`
        : `"${payment.name}" will be permanently deleted and no future transactions will be created.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void cancelRecurringReminder(String(payment._id));
            removePayment({ id: payment._id });
          },
        },
      ]
    );
  }

  function renderCard(payment: any) {
    const isPaused = payment.isPaused === true;
    const isSinkingFundLinked = !!payment.linkedGoalId;
    return (
      <View key={payment._id} className='bg-white rounded-2xl p-4 mb-3'>
        <View className='flex-row items-center gap-3'>
          <View className='w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center'>
            <Feather name={isSinkingFundLinked ? 'target' : 'repeat'} size={18} color='#000' />
          </View>

          <View className='flex-1'>
            <View className='flex-row items-center gap-2 flex-wrap'>
              <Text className='text-[15px] font-semibold text-black'>
                {payment.name}
              </Text>
              {isPaused && (
                <View className='bg-neutral-100 px-2 py-0.5 rounded-full'>
                  <Text className='text-[10px] font-medium text-neutral-400'>Paused</Text>
                </View>
              )}
              {isSinkingFundLinked && (
                <View className='bg-emerald-50 px-2 py-0.5 rounded-full'>
                  <Text className='text-[10px] font-medium text-emerald-600'>Sinking Fund</Text>
                </View>
              )}
            </View>
            <Text className='text-[12px] text-neutral-400 mt-0.5'>
              {payment.frequency === 'monthly' ? 'Monthly' : 'Yearly'} ·{' '}
              {isPaused ? 'Paused' : `Next: ${formatDateShort(payment.nextDue)}`}
              {payment.billingDay ? ` · renews ${payment.billingDay}th` : ''}
            </Text>
          </View>

          <View className='items-end'>
            <Text className='text-[15px] font-bold text-black'>
              {formatCurrency(payment.amount, currency)}
            </Text>
            {payment.frequency === 'yearly' && (
              <Text className='text-[11px] text-neutral-400'>
                {formatCurrency(payment.amount / 12, currency)}/mo
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View className='flex-row gap-2 mt-3'>
          {!isSinkingFundLinked && (
            <Pressable
              onPress={() => togglePause({ id: payment._id })}
              className='flex-1 flex-row items-center justify-center rounded-xl py-2.5 gap-1.5 bg-neutral-100'
            >
              <Feather name={isPaused ? 'play' : 'pause'} size={13} color='#525252' />
              <Text className='text-[13px] font-medium text-neutral-600'>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => handleDelete(payment)}
            className='w-10 h-10 items-center justify-center rounded-xl bg-neutral-100'
          >
            <Feather name='trash-2' size={14} color='#A3A3A3' />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className='flex-1 bg-neutral-50'
        contentContainerStyle={{}}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className='px-6 pt-4 pb-2 flex-row items-center gap-3'>
          <Pressable
            onPress={() => router.back()}
            className='w-10 h-10 rounded-full bg-white items-center justify-center'
          >
            <Feather name='arrow-left' size={20} color='#000' />
          </Pressable>
          <Text className='flex-1 text-[22px] font-bold text-black tracking-tight'>
            Subscriptions
          </Text>
          <Pressable
            onPress={() => setShowAdd(true)}
            className='w-10 h-10 rounded-full bg-white items-center justify-center'
          >
            <Feather name='plus' size={18} color='#000' />
          </Pressable>
        </View>

        {/* Monthly cost summary */}
        {(payments ?? []).length > 0 && (
          <View className='mx-6 mt-4 bg-black rounded-2xl p-5'>
            <Text className='text-neutral-400 text-[13px]'>Monthly cost</Text>
            <Text className='text-white text-[28px] font-bold tracking-tight mt-1'>
              {formatCurrency(
                active.reduce((sum, p) => {
                  if (p.frequency === 'monthly') return sum + p.amount;
                  return sum + p.amount / 12;
                }, 0),
                currency
              )}
            </Text>
            <Text className='text-neutral-500 text-[12px] mt-1'>
              {active.length} active · {paused.length} paused
            </Text>
          </View>
        )}

        {/* List */}
        <View className='px-6 mt-6'>
          {active.length === 0 && paused.length === 0 ? (
            <View className='bg-white rounded-2xl p-10 items-center'>
              <Feather name='repeat' size={32} color='#D4D4D4' />
              <Text className='text-neutral-400 text-[14px] mt-3 font-medium'>
                No subscriptions yet
              </Text>
              <Text className='text-neutral-300 text-[12px] mt-1'>Tap + to add one</Text>
            </View>
          ) : (
            <>
              {active.length > 0 && (
                <>
                  <Text className='text-[13px] font-semibold text-neutral-400 uppercase tracking-wider mb-3'>
                    Active
                  </Text>
                  {active.map(renderCard)}
                </>
              )}
              {paused.length > 0 && (
                <>
                  <Text className='text-[13px] font-semibold text-neutral-400 uppercase tracking-wider mb-3 mt-4'>
                    Paused
                  </Text>
                  {paused.map(renderCard)}
                </>
              )}
            </>
          )}
        </View>

        <View className='h-32' />
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAdd}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={resetModal}
      >
        <ScrollView
          className='flex-1 bg-neutral-50'
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View className='px-6 pt-5 pb-4 flex-row justify-between items-center border-b border-neutral-100'>
            <Text className='text-[18px] font-bold text-black'>Add Subscription</Text>
            <Pressable onPress={resetModal}>
              <Feather name='x' size={20} color='#000' />
            </Pressable>
          </View>

          <View className='px-6 pt-6'>
            {/* Name */}
            <Text className='text-[13px] font-medium text-neutral-500 mb-2'>Name</Text>
            <View className='bg-white rounded-2xl px-4 py-3.5 mb-5'>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder='e.g. Netflix, Health Insurance...'
                placeholderTextColor='#D4D4D4'
                className='text-[16px] text-black'
                autoFocus
              />
            </View>

            {/* Amount */}
            <Text className='text-[13px] font-medium text-neutral-500 mb-2'>Amount</Text>
            <View className='bg-white rounded-2xl px-4 py-3 flex-row items-center gap-2 mb-5'>
              <Text className='text-[18px] text-neutral-300 font-medium'>{currency}</Text>
              <TextInput
                value={newAmount}
                onChangeText={setNewAmount}
                placeholder='0'
                placeholderTextColor='#D4D4D4'
                keyboardType='numeric'
                className='flex-1 text-[24px] font-bold text-black'
              />
            </View>

            {/* Frequency */}
            <Text className='text-[13px] font-medium text-neutral-500 mb-2'>Frequency</Text>
            <View className='flex-row gap-3 mb-5'>
              <Pressable
                onPress={() => { setNewFreq('monthly'); setIsSinkingFund(false); }}
                className={`flex-1 py-3 rounded-xl items-center ${newFreq === 'monthly' ? 'bg-black' : 'bg-white'}`}
              >
                <Text className={`text-[14px] font-semibold ${newFreq === 'monthly' ? 'text-white' : 'text-black'}`}>
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setNewFreq('yearly')}
                className={`flex-1 py-3 rounded-xl items-center ${newFreq === 'yearly' ? 'bg-black' : 'bg-white'}`}
              >
                <Text className={`text-[14px] font-semibold ${newFreq === 'yearly' ? 'text-white' : 'text-black'}`}>
                  Yearly
                </Text>
              </Pressable>
            </View>

            {/* Billing date */}
            <Text className='text-[13px] font-medium text-neutral-500 mb-1'>Billing date</Text>
            <Text className='text-[11px] text-neutral-400 mb-3'>
              Pick when you purchased it or just the day it renews — we only use the day number for reminders
            </Text>
            <Pressable
              onPress={() => setShowCalendar(!showCalendar)}
              className='bg-white rounded-2xl px-4 py-3.5 mb-2 flex-row items-center justify-between'
            >
              <Text className={selectedDate ? 'text-[15px] text-black font-medium' : 'text-[15px] text-neutral-300'}>
                {selectedDate
                  ? `${selectedDate.slice(8, 10)}/${selectedDate.slice(5, 7)}/${selectedDate.slice(0, 4)}`
                  : 'Select date (optional)'}
              </Text>
              <Feather name={showCalendar ? 'chevron-up' : 'calendar'} size={16} color='#A3A3A3' />
            </Pressable>
            {showCalendar && (
              <View className='mb-5'>
                <BillingDayPicker
                  selectedDate={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setShowCalendar(false); }}
                  onClear={() => setSelectedDate(null)}
                />
              </View>
            )}
            {!showCalendar && <View className='mb-5' />}

            {/* Sinking fund toggle — only for yearly */}
            {newFreq === 'yearly' && (
              <View className='bg-white rounded-2xl p-4 mb-5'>
                <View className='flex-row items-center justify-between'>
                  <View className='flex-1 mr-3'>
                    <Text className='text-[14px] font-semibold text-black'>Save up with a goal</Text>
                    <Text className='text-[12px] text-neutral-400 mt-0.5'>
                      Set aside money each month so you're ready when the bill hits
                    </Text>
                  </View>
                  <Switch
                    value={isSinkingFund}
                    onValueChange={setIsSinkingFund}
                    trackColor={{ false: '#E5E5E5', true: '#000000' }}
                    thumbColor='#FFFFFF'
                  />
                </View>

                {/* Goal customisation */}
                {isSinkingFund && (
                  <View className='mt-4 pt-4 border-t border-neutral-100'>
                    <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>
                      Goal Icon
                    </Text>
                    <View className='flex-row flex-wrap gap-2 mb-4'>
                      {GOAL_ICONS.map((item) => (
                        <Pressable
                          key={item.icon}
                          onPress={() => setGoalIcon(item.icon)}
                          className={`w-11 h-11 rounded-xl items-center justify-center ${
                            goalIcon === item.icon ? 'bg-black' : 'bg-neutral-100'
                          }`}
                        >
                          <Feather
                            name={item.icon}
                            size={18}
                            color={goalIcon === item.icon ? '#fff' : '#000'}
                          />
                        </Pressable>
                      ))}
                    </View>

                    <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>
                      Goal Color
                    </Text>
                    <View className='flex-row gap-3'>
                      {GOAL_COLORS.map((color) => (
                        <Pressable
                          key={color}
                          onPress={() => setGoalColor(color)}
                          className='w-9 h-9 rounded-full items-center justify-center'
                          style={{
                            backgroundColor: color,
                            borderWidth: goalColor === color ? 2 : 0,
                            borderColor: '#D4D4D4',
                          }}
                        >
                          {goalColor === color && (
                            <Feather name='check' size={14} color='#fff' />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Monthly equivalent hint for yearly */}
            {newFreq === 'yearly' && newAmount && parseFloat(newAmount) > 0 && (
              <View className='bg-neutral-100 rounded-xl px-4 py-3 mb-5 flex-row items-center gap-2'>
                <Feather name='info' size={13} color='#A3A3A3' />
                <Text className='text-[12px] text-neutral-500'>
                  Monthly equivalent:{' '}
                  <Text className='font-semibold'>
                    {currency} {(parseFloat(newAmount) / 12).toFixed(0)}/mo
                  </Text>
                  {isSinkingFund ? ' — set aside this much each month' : ''}
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleAdd}
              disabled={!newName.trim() || !newAmount || parseFloat(newAmount) <= 0}
              className={`rounded-2xl py-4 items-center ${
                newName.trim() && newAmount && parseFloat(newAmount) > 0 ? 'bg-black' : 'bg-neutral-300'
              }`}
            >
              <Text className='text-white text-[15px] font-bold'>
                {newFreq === 'yearly' && isSinkingFund ? 'Add & Create Goal' : 'Add'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </>
  );
}
