import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDateShort } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFreq, setNewFreq] = useState<'monthly' | 'yearly'>('monthly');

  const payments = useQuery(api.recurring.list, userId ? { userId } : 'skip');
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');

  const createPayment = useMutation(api.recurring.create);
  const togglePause = useMutation(api.recurring.togglePause);
  const removePayment = useMutation(api.recurring.remove);

  const currency = prefs?.currency ?? 'INR';

  const active = (payments ?? []).filter((p) => !p.isPaused);
  const paused = (payments ?? []).filter((p) => p.isPaused);

  async function handleAdd() {
    if (!userId || !newName.trim()) return;
    const amount = parseFloat(newAmount);
    if (!amount || amount <= 0) return;
    await createPayment({ userId, name: newName.trim(), amount, frequency: newFreq });
    setNewName('');
    setNewAmount('');
    setNewFreq('monthly');
    setShowAdd(false);
  }

  function handleDelete(payment: any) {
    Alert.alert(
      'Delete Subscription',
      `"${payment.name}" will be permanently deleted and no future transactions will be created.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removePayment({ id: payment._id }),
        },
      ]
    );
  }

  function renderCard(payment: any) {
    const isPaused = payment.isPaused === true;
    return (
      <View key={payment._id} className='bg-white rounded-2xl p-4 mb-3'>
        <View className='flex-row items-center gap-3'>
          <View className='w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center'>
            <Feather name='repeat' size={18} color='#000' />
          </View>

          <View className='flex-1'>
            <View className='flex-row items-center gap-2'>
              <Text className='text-[15px] font-semibold text-black'>
                {payment.name}
              </Text>
              {isPaused && (
                <View className='bg-neutral-100 px-2 py-0.5 rounded-full'>
                  <Text className='text-[10px] font-medium text-neutral-400'>
                    Paused
                  </Text>
                </View>
              )}
            </View>
            <Text className='text-[12px] text-neutral-400 mt-0.5'>
              {payment.frequency === 'monthly' ? 'Monthly' : 'Yearly'} ·{' '}
              {isPaused
                ? 'Paused'
                : `Next: ${formatDateShort(payment.nextDue)}`}
            </Text>
          </View>

          <Text className='text-[15px] font-bold text-black'>
            {formatCurrency(payment.amount, currency)}
          </Text>
        </View>

        {/* Actions */}
        <View className='flex-row gap-2 mt-3'>
          <Pressable
            onPress={() => togglePause({ id: payment._id })}
            className='flex-1 flex-row items-center justify-center rounded-xl py-2.5 gap-1.5 bg-neutral-100'
          >
            <Feather
              name={isPaused ? 'play' : 'pause'}
              size={13}
              color='#525252'
            />
            <Text className='text-[13px] font-medium text-neutral-600'>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </Pressable>

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
        contentContainerStyle={{ paddingTop: insets.top }}
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
            <Text className='text-neutral-400 text-[13px]'>
              Monthly cost
            </Text>
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

        {/* Active */}
        <View className='px-6 mt-6'>
          {active.length === 0 && paused.length === 0 ? (
            <View className='bg-white rounded-2xl p-10 items-center'>
              <Feather name='repeat' size={32} color='#D4D4D4' />
              <Text className='text-neutral-400 text-[14px] mt-3 font-medium'>
                No subscriptions yet
              </Text>
              <Text className='text-neutral-300 text-[12px] mt-1'>
                Tap + to add one
              </Text>
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
        onRequestClose={() => setShowAdd(false)}
      >
        <View className='flex-1 bg-neutral-50' style={{ paddingTop: insets.top }}>
          <View className='px-6 pt-5 pb-4 flex-row justify-between items-center border-b border-neutral-100'>
            <Text className='text-[18px] font-bold text-black'>
              Add Subscription
            </Text>
            <Pressable onPress={() => setShowAdd(false)}>
              <Feather name='x' size={20} color='#000' />
            </Pressable>
          </View>

          <View className='px-6 pt-6'>
            <Text className='text-[13px] font-medium text-neutral-500 mb-2'>
              Name
            </Text>
            <View className='bg-white rounded-2xl px-4 py-3.5 mb-5'>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder='e.g. Netflix, Spotify, Rent...'
                placeholderTextColor='#D4D4D4'
                className='text-[16px] text-black'
                autoFocus
              />
            </View>

            <Text className='text-[13px] font-medium text-neutral-500 mb-2'>
              Amount
            </Text>
            <View className='bg-white rounded-2xl px-4 py-3 flex-row items-center gap-2 mb-5'>
              <Text className='text-[18px] text-neutral-300 font-medium'>
                {currency}
              </Text>
              <TextInput
                value={newAmount}
                onChangeText={setNewAmount}
                placeholder='0'
                placeholderTextColor='#D4D4D4'
                keyboardType='numeric'
                className='flex-1 text-[24px] font-bold text-black'
              />
            </View>

            <Text className='text-[13px] font-medium text-neutral-500 mb-2'>
              Frequency
            </Text>
            <View className='flex-row gap-3 mb-8'>
              <Pressable
                onPress={() => setNewFreq('monthly')}
                className={`flex-1 py-3 rounded-xl items-center ${newFreq === 'monthly' ? 'bg-black' : 'bg-white'}`}
              >
                <Text
                  className={`text-[14px] font-semibold ${newFreq === 'monthly' ? 'text-white' : 'text-black'}`}
                >
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setNewFreq('yearly')}
                className={`flex-1 py-3 rounded-xl items-center ${newFreq === 'yearly' ? 'bg-black' : 'bg-white'}`}
              >
                <Text
                  className={`text-[14px] font-semibold ${newFreq === 'yearly' ? 'text-white' : 'text-black'}`}
                >
                  Yearly
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleAdd}
              className='bg-black rounded-2xl py-4 items-center'
            >
              <Text className='text-white text-[15px] font-bold'>Add</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
