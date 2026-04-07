import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useAuthenticatedUserId } from '@/lib/hooks/useAuthenticatedUserId';
import { useCachedCurrency } from '@/lib/hooks/useCachedCurrency';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { localDateString } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';
  const authenticatedUserId = useAuthenticatedUserId();

  const prefs = useQuery(api.preferences.get, authenticatedUserId ? { userId: authenticatedUserId } : 'skip');
  const debt = useQuery(
    api.peopleDebts.getById,
    authenticatedUserId && id ? { id: id as any, userId: authenticatedUserId } : 'skip'
  );
  const addPaymentMutation = useMutation(api.peopleDebts.addPayment);
  const removePaymentMutation = useMutation(api.peopleDebts.removePayment);
  const removeDebtMutation = useMutation(api.peopleDebts.remove);
  const settleDebtMutation = useMutation(api.peopleDebts.settle);
  const unsettleDebtMutation = useMutation(api.peopleDebts.unsettle);

  const currency = useCachedCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [showModal, setShowModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(localDateString());
  const [payNote, setPayNote] = useState('');
  const [showDateChips, setShowDateChips] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const [saving, setSaving] = useState(false);

  const today = localDateString();
  const yesterday = getYesterday();

  const resetPayForm = () => {
    setPayAmount('');
    setPayDate(localDateString());
    setPayNote('');
    setShowDateChips(false);
    setCustomDateInput('');
  };

  const handleAddPayment = async () => {
    const numAmount = parseFloat(payAmount);
    if (!payAmount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      await addPaymentMutation({
        userId,
        debtId: id as any,
        amount: numAmount,
        date: payDate,
        ...(payNote.trim() ? { note: payNote.trim() } : {}),
      });
      setShowModal(false);
      resetPayForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = (payId: string) => {
    Alert.alert('Delete Payment', 'Remove this payment record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removePaymentMutation({ id: payId as any, userId }),
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Record',
      `Delete all records for ${debt?.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeDebtMutation({ id: id as any, userId });
            router.back();
          },
        },
      ]
    );
  };

  const handleSettle = () => {
    const remaining = debt ? Math.max(debt.remaining, 0) : 0;
    const message =
      remaining > 0
        ? `${currencySymbol}${remaining.toLocaleString()} is still unpaid. Mark as settled anyway? (e.g. forgiven or paid outside the app)`
        : `Mark all debt with ${debt?.name} as settled?`;
    Alert.alert('Mark as Settled', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Settle',
        onPress: () => settleDebtMutation({ id: id as any, userId }),
      },
    ]);
  };

  const handleUnsettle = () => {
    Alert.alert('Reopen', `Reopen this record for ${debt?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reopen',
        onPress: () => unsettleDebtMutation({ id: id as any, userId }),
      },
    ]);
  };

  if (debt === undefined) {
    return (
      <View className='flex-1 items-center justify-center bg-neutral-50'>
        <ActivityIndicator />
      </View>
    );
  }

  if (debt === null) {
    return (
      <View className='flex-1 items-center justify-center bg-neutral-50'>
        <Text className='text-neutral-400'>Record not found.</Text>
      </View>
    );
  }

  const pct =
    debt.totalAmount > 0 ? Math.min((debt.paid / debt.totalAmount) * 100, 100) : 0;
  const isLent = debt.type === 'lent';
  const accentColor = isLent ? '#16a34a' : '#dc2626';
  const avatarBg = isLent ? '#dcfce7' : '#fee2e2';
  const isFullyPaid = debt.remaining <= 0 || debt.isSettled;

  return (
    <View className='flex-1 bg-neutral-50'>
      {/* Header */}
      <View className='px-6 pt-4 pb-4 bg-white border-b border-neutral-100'>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center gap-4'>
            <Pressable
              onPress={() => router.back()}
              className='w-9 h-9 rounded-full bg-neutral-100 items-center justify-center'
            >
              <Feather name='arrow-left' size={18} color='#000' />
            </Pressable>
            <View>
              <Text className='text-[18px] font-bold text-black'>{debt.name}</Text>
              <View className='flex-row items-center gap-2 mt-0.5'>
                <View
                  className='px-2 py-0.5 rounded-full'
                  style={{ backgroundColor: avatarBg }}
                >
                  <Text
                    className='text-[11px] font-semibold'
                    style={{ color: accentColor }}
                  >
                    {isLent ? 'You Lent' : 'You Borrowed'}
                  </Text>
                </View>
                <Text className='text-[11px] text-neutral-400'>
                  {formatDateDisplay(debt.date)}
                </Text>
              </View>
            </View>
          </View>
          <View className='flex-row items-center gap-3'>
            {debt.isSettled ? (
              <Pressable
                onPress={handleUnsettle}
                className='px-3 py-2 rounded-xl bg-neutral-100'
              >
                <Text className='text-[12px] font-semibold text-black'>Reopen</Text>
              </Pressable>
            ) : !isFullyPaid && (
              <Pressable
                onPress={handleSettle}
                className='px-3 py-2 rounded-xl bg-neutral-100'
              >
                <Text className='text-[12px] font-semibold text-black'>Settle</Text>
              </Pressable>
            )}
            <Pressable onPress={handleDelete}>
              <Feather name='trash-2' size={18} color='#dc2626' />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        className='flex-1'
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <View className='bg-white rounded-2xl p-4 mb-4'>
          <View className='flex-row mb-4'>
            {[
              { label: 'Total', value: debt.totalAmount },
              { label: 'Returned', value: debt.paid },
              { label: 'Remaining', value: Math.max(debt.remaining, 0) },
            ].map((item, i) => (
              <View
                key={item.label}
                className={`flex-1 ${i > 0 ? 'border-l border-neutral-100 pl-3 ml-3' : ''}`}
              >
                <Text className='text-[11px] text-neutral-400 mb-0.5'>{item.label}</Text>
                <Text
                  className='text-[16px] font-bold'
                  style={{
                    color:
                      i === 2 && debt.remaining <= 0 ? '#16a34a' : '#000',
                  }}
                >
                  {currencySymbol}{item.value.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
          <View className='h-2 bg-neutral-100 rounded-full overflow-hidden'>
            <View
              className='h-full rounded-full'
              style={{ width: `${pct}%`, backgroundColor: accentColor }}
            />
          </View>
          <Text className='text-[11px] text-neutral-400 mt-1.5'>
            {isFullyPaid ? 'Fully settled' : `${Math.round(pct)}% returned`}
          </Text>
        </View>

        {/* Payments */}
        <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 ml-1'>
          Payment History
        </Text>
        {debt.payments.length === 0 ? (
          <View className='bg-white rounded-2xl p-6 items-center'>
            <Text className='text-[13px] text-neutral-400'>No payments recorded yet.</Text>
          </View>
        ) : (
          <View className='bg-white rounded-2xl px-4'>
            {(debt.payments as any[]).map((p, i) => (
              <Pressable
                key={p._id}
                onLongPress={() => handleDeletePayment(p._id)}
                className={`flex-row items-center py-3.5 ${
                  i < debt.payments.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <View
                  className='w-8 h-8 rounded-full items-center justify-center mr-3'
                  style={{ backgroundColor: avatarBg }}
                >
                  <Feather name='arrow-down-left' size={14} color={accentColor} />
                </View>
                <View className='flex-1'>
                  <Text className='text-[14px] font-semibold text-black'>
                    {currencySymbol}{p.amount.toLocaleString()}
                  </Text>
                  {p.note ? (
                    <Text className='text-[12px] text-neutral-400'>{p.note}</Text>
                  ) : null}
                </View>
                <Text className='text-[12px] text-neutral-400'>
                  {formatDateDisplay(p.date)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {debt.payments.length > 0 && (
          <Text className='text-[11px] text-neutral-400 text-center mt-2'>
            Long press to delete a payment
          </Text>
        )}
      </ScrollView>

      {/* Record Payment button */}
      {!isFullyPaid && (
        <View className='px-4 pb-8 pt-3 bg-white border-t border-neutral-100'>
          <Pressable
            onPress={() => setShowModal(true)}
            className='bg-black rounded-2xl py-4 items-center'
          >
            <Text className='text-white font-semibold text-[15px]'>Record Payment</Text>
          </Pressable>
        </View>
      )}

      {/* Payment Modal */}
      <Modal
        visible={showModal}
        presentationStyle='pageSheet'
        animationType='slide'
        onRequestClose={() => {
          setShowModal(false);
          resetPayForm();
        }}
      >
        <KeyboardAvoidingView
          className='flex-1 bg-white'
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={30}
        >
          <View className='px-6 pt-6 pb-4 flex-row items-center justify-between border-b border-neutral-100'>
            <Text className='text-[18px] font-bold text-black'>Record Payment</Text>
            <Pressable
              onPress={() => {
                setShowModal(false);
                resetPayForm();
              }}
            >
              <Feather name='x' size={20} color='#737373' />
            </Pressable>
          </View>

          <ScrollView
            className='flex-1 px-6'
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps='handled'
          >
            {/* Amount */}
            <Text className='text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-2'>
              Amount
            </Text>
            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-4'>
              <TextInput
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder='0'
                placeholderTextColor='#A3A3A3'
                className='text-[15px] text-black'
                keyboardType='decimal-pad'
                autoFocus
              />
            </View>

            {/* Date */}
            <Text className='text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-2'>
              Date
            </Text>
            <Pressable
              onPress={() => setShowDateChips(!showDateChips)}
              className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-2 flex-row items-center justify-between'
            >
              <Text className='text-[15px] text-black'>{formatDateDisplay(payDate)}</Text>
              <Feather name='calendar' size={14} color='#737373' />
            </Pressable>
            {showDateChips && (
              <View className='flex-row gap-2 mb-4 flex-wrap'>
                {[
                  { label: 'Today', value: today },
                  { label: 'Yesterday', value: yesterday },
                ].map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => {
                      setPayDate(opt.value);
                      setShowDateChips(false);
                      setCustomDateInput('');
                    }}
                    className='px-3 py-2 rounded-xl'
                    style={{ backgroundColor: payDate === opt.value ? '#000' : '#f5f5f5' }}
                  >
                    <Text
                      style={{
                        color: payDate === opt.value ? '#fff' : '#000',
                        fontSize: 13,
                        fontWeight: '500',
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
                <View className='flex-1 bg-neutral-100 rounded-xl px-3 py-2'>
                  <TextInput
                    value={customDateInput}
                    onChangeText={setCustomDateInput}
                    placeholder='YYYY-MM-DD'
                    placeholderTextColor='#A3A3A3'
                    className='text-[13px] text-black'
                    keyboardType='numbers-and-punctuation'
                    onEndEditing={(e) => {
                      const val = e.nativeEvent.text.trim();
                      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                        setPayDate(val);
                        setShowDateChips(false);
                      }
                    }}
                  />
                </View>
              </View>
            )}
            {!showDateChips && <View className='mb-2' />}

            {/* Note */}
            <Text className='text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-2'>
              Note (optional)
            </Text>
            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-6'>
              <TextInput
                value={payNote}
                onChangeText={setPayNote}
                placeholder='e.g. Cash, UPI, partial, etc.'
                placeholderTextColor='#A3A3A3'
                className='text-[15px] text-black'
              />
            </View>

            {/* Save */}
            <Pressable
              onPress={handleAddPayment}
              disabled={saving}
              className='bg-black rounded-2xl py-4 items-center'
            >
              {saving ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text className='text-white font-semibold text-[15px]'>Add Payment</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
