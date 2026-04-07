import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useAuthenticatedUserId } from '@/lib/hooks/useAuthenticatedUserId';
import { useCachedCurrency } from '@/lib/hooks/useCachedCurrency';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { localDateString } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
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

export default function PeopleScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';
  const authenticatedUserId = useAuthenticatedUserId();
  const prefs = useQuery(api.preferences.get, authenticatedUserId ? { userId: authenticatedUserId } : 'skip');
  const debts = useQuery(api.peopleDebts.list, authenticatedUserId ? { userId: authenticatedUserId } : 'skip');
  const createDebt = useMutation(api.peopleDebts.create);
  const addPaymentMutation = useMutation(api.peopleDebts.addPayment);
  const currency = useCachedCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  // Quick pay modal
  const [payTarget, setPayTarget] = useState<{ debtId: string; name: string } | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(localDateString());
  const [payNote, setPayNote] = useState('');
  const [payShowDateChips, setPayShowDateChips] = useState(false);
  const [payCustomDate, setPayCustomDate] = useState('');
  const [paying, setPaying] = useState(false);

  const resetPayForm = () => {
    setPayAmount('');
    setPayDate(localDateString());
    setPayNote('');
    setPayShowDateChips(false);
    setPayCustomDate('');
  };

  const handleAddPayment = async () => {
    const num = parseFloat(payAmount);
    if (!payAmount || isNaN(num) || num <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    setPaying(true);
    try {
      await addPaymentMutation({
        userId,
        debtId: payTarget!.debtId as any,
        amount: num,
        date: payDate,
        ...(payNote.trim() ? { note: payNote.trim() } : {}),
      });
      setPayTarget(null);
      resetPayForm();
    } finally {
      setPaying(false);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(localDateString());
  const [note, setNote] = useState('');
  const [showDateChips, setShowDateChips] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const [saving, setSaving] = useState(false);

  const today = localDateString();
  const yesterday = getYesterday();

  const resetForm = () => {
    setType('lent');
    setName('');
    setAmount('');
    setDate(localDateString());
    setNote('');
    setShowDateChips(false);
    setCustomDateInput('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a person name.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      await createDebt({
        userId,
        name: name.trim(),
        type,
        totalAmount: numAmount,
        date,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setShowModal(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const isFullyPaid = (d: any) => d.totalAmount > 0 && d.paid >= d.totalAmount;
  const isDone = (d: any) => d.isSettled || isFullyPaid(d);
  const lentDebts = (debts ?? []).filter((d) => d.type === 'lent' && !isDone(d));
  const borrowedDebts = (debts ?? []).filter((d) => d.type === 'borrowed' && !isDone(d));
  const settledDebts = (debts ?? []).filter(isDone);

  const renderDebt = (debt: any) => {
    const pct =
      debt.totalAmount > 0 ? Math.min((debt.paid / debt.totalAmount) * 100, 100) : 0;
    const isLent = debt.type === 'lent';
    const accentColor = isLent ? '#16a34a' : '#dc2626';
    const avatarBg = isLent ? '#dcfce7' : '#fee2e2';

    return (
      <Pressable
        key={debt._id}
        onPress={() =>
          router.push({ pathname: '/person-detail', params: { id: debt._id } })
        }
        className='flex-row items-center bg-white rounded-2xl px-4 py-3.5 mb-2'
      >
        <View
          className='w-10 h-10 rounded-full items-center justify-center mr-3'
          style={{ backgroundColor: avatarBg }}
        >
          <Text
            className='text-[15px] font-bold'
            style={{ color: accentColor }}
          >
            {debt.name[0].toUpperCase()}
          </Text>
        </View>
        <View className='flex-1'>
          <View className='flex-row items-center justify-between mb-1.5'>
            <Text className='text-[14px] font-semibold text-black'>{debt.name}</Text>
            <Text className='text-[14px] font-bold' style={{ color: accentColor }}>
              {currencySymbol}{debt.totalAmount.toLocaleString()}
            </Text>
          </View>
          <View className='h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-1'>
            <View
              className='h-full rounded-full'
              style={{ width: `${pct}%`, backgroundColor: accentColor }}
            />
          </View>
          <View className='flex-row items-center justify-between'>
            <Text className='text-[11px] text-neutral-400'>
              {debt.isSettled && !isFullyPaid(debt)
                ? 'Settled'
                : pct >= 100
                ? 'Fully paid'
                : `${Math.round(pct)}% returned`}
            </Text>
            <Text className='text-[11px] text-neutral-400'>{formatDateDisplay(debt.date)}</Text>
          </View>
        </View>
        {pct < 100 && !debt.isSettled && (
          <Pressable
            onPress={() => setPayTarget({ debtId: debt._id, name: debt.name })}
            className='w-8 h-8 rounded-full items-center justify-center ml-2'
            style={{ backgroundColor: avatarBg }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name='plus' size={15} color={accentColor} />
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <View className='flex-1 bg-neutral-50'>
      {/* Header */}
      <View className='px-6 pt-4 pb-4 flex-row items-center justify-between'>
        <View className='flex-row items-center gap-4'>
          <Pressable
            onPress={() => router.back()}
            className='w-9 h-9 rounded-full bg-neutral-100 items-center justify-center'
          >
            <Feather name='arrow-left' size={18} color='#000' />
          </Pressable>
          <Text className='text-[18px] font-bold text-black'>People</Text>
        </View>
        <Pressable
          onPress={() => setShowModal(true)}
          className='w-9 h-9 rounded-full bg-black items-center justify-center'
        >
          <Feather name='plus' size={18} color='#fff' />
        </Pressable>
      </View>

      <ScrollView
        className='flex-1'
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {debts === undefined ? (
          <ActivityIndicator className='mt-8' />
        ) : lentDebts.length === 0 &&
          borrowedDebts.length === 0 &&
          settledDebts.length === 0 ? (
          <View className='items-center mt-20'>
            <View className='w-16 h-16 rounded-2xl bg-neutral-100 items-center justify-center mb-4'>
              <Feather name='users' size={28} color='#A3A3A3' />
            </View>
            <Text className='text-[16px] font-semibold text-black'>No records yet</Text>
            <Text className='text-[13px] text-neutral-400 text-center mt-1 px-8'>
              Track money you lent to or borrowed from people.
            </Text>
            <Pressable
              onPress={() => setShowModal(true)}
              className='mt-6 bg-black rounded-2xl px-6 py-3'
            >
              <Text className='text-white font-semibold text-[14px]'>Add First Record</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {lentDebts.length > 0 && (
              <View className='mb-4'>
                <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 ml-1'>
                  You Lent
                </Text>
                {lentDebts.map(renderDebt)}
              </View>
            )}
            {borrowedDebts.length > 0 && (
              <View className='mb-4'>
                <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 ml-1'>
                  You Borrowed
                </Text>
                {borrowedDebts.map(renderDebt)}
              </View>
            )}
            {settledDebts.length > 0 && (
              <View className='mb-4'>
                <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 ml-1'>
                  Settled
                </Text>
                {settledDebts.map(renderDebt)}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Quick Pay Modal */}
      <Modal
        visible={payTarget !== null}
        presentationStyle='pageSheet'
        animationType='slide'
        onRequestClose={() => { setPayTarget(null); resetPayForm(); }}
      >
        <KeyboardAvoidingView
          className='flex-1 bg-white'
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={30}
        >
          <View className='px-6 pt-6 pb-4 flex-row items-center justify-between border-b border-neutral-100'>
            <View>
              <Text className='text-[18px] font-bold text-black'>Record Payment</Text>
              {payTarget && (
                <Text className='text-[13px] text-neutral-400 mt-0.5'>{payTarget.name}</Text>
              )}
            </View>
            <Pressable onPress={() => { setPayTarget(null); resetPayForm(); }}>
              <Feather name='x' size={20} color='#737373' />
            </Pressable>
          </View>

          <ScrollView
            className='flex-1 px-6'
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps='handled'
          >
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

            <Text className='text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-2'>
              Date
            </Text>
            <Pressable
              onPress={() => setPayShowDateChips(!payShowDateChips)}
              className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-2 flex-row items-center justify-between'
            >
              <Text className='text-[15px] text-black'>{formatDateDisplay(payDate)}</Text>
              <Feather name='calendar' size={14} color='#737373' />
            </Pressable>
            {payShowDateChips && (
              <View className='flex-row gap-2 mb-4 flex-wrap'>
                {[
                  { label: 'Today', value: today },
                  { label: 'Yesterday', value: yesterday },
                ].map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => { setPayDate(opt.value); setPayShowDateChips(false); setPayCustomDate(''); }}
                    className='px-3 py-2 rounded-xl'
                    style={{ backgroundColor: payDate === opt.value ? '#000' : '#f5f5f5' }}
                  >
                    <Text style={{ color: payDate === opt.value ? '#fff' : '#000', fontSize: 13, fontWeight: '500' }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
                <View className='flex-1 bg-neutral-100 rounded-xl px-3 py-2'>
                  <TextInput
                    value={payCustomDate}
                    onChangeText={setPayCustomDate}
                    placeholder='YYYY-MM-DD'
                    placeholderTextColor='#A3A3A3'
                    className='text-[13px] text-black'
                    keyboardType='numbers-and-punctuation'
                    onEndEditing={(e) => {
                      const val = e.nativeEvent.text.trim();
                      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                        setPayDate(val);
                        setPayShowDateChips(false);
                      }
                    }}
                  />
                </View>
              </View>
            )}
            {!payShowDateChips && <View className='mb-2' />}

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

            <Pressable
              onPress={handleAddPayment}
              disabled={paying}
              className='bg-black rounded-2xl py-4 items-center'
            >
              {paying ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text className='text-white font-semibold text-[15px]'>Add Payment</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Modal */}
      <Modal
        visible={showModal}
        presentationStyle='pageSheet'
        animationType='slide'
        onRequestClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          className='flex-1 bg-white'
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={30}
        >
          <View className='px-6 pt-6 pb-4 flex-row items-center justify-between border-b border-neutral-100'>
            <Text className='text-[18px] font-bold text-black'>Add Record</Text>
            <Pressable
              onPress={() => {
                setShowModal(false);
                resetForm();
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
            {/* Type toggle */}
            <View className='flex-row bg-neutral-100 rounded-2xl p-1 mb-5'>
              {(['lent', 'borrowed'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  className='flex-1 py-2.5 rounded-xl items-center'
                  style={{ backgroundColor: type === t ? '#000' : 'transparent' }}
                >
                  <Text
                    className='text-[14px] font-semibold'
                    style={{ color: type === t ? '#fff' : '#737373' }}
                  >
                    {t === 'lent' ? 'I Lent' : 'I Borrowed'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Name */}
            <Text className='text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-2'>
              Person Name
            </Text>
            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-4'>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder='e.g. Rahul'
                placeholderTextColor='#A3A3A3'
                className='text-[15px] text-black'
                autoCapitalize='words'
              />
            </View>

            {/* Amount */}
            <Text className='text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-2'>
              Amount
            </Text>
            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-4'>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder='0'
                placeholderTextColor='#A3A3A3'
                className='text-[15px] text-black'
                keyboardType='decimal-pad'
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
              <Text className='text-[15px] text-black'>{formatDateDisplay(date)}</Text>
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
                      setDate(opt.value);
                      setShowDateChips(false);
                      setCustomDateInput('');
                    }}
                    className='px-3 py-2 rounded-xl'
                    style={{ backgroundColor: date === opt.value ? '#000' : '#f5f5f5' }}
                  >
                    <Text
                      style={{
                        color: date === opt.value ? '#fff' : '#000',
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
                        setDate(val);
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
                value={note}
                onChangeText={setNote}
                placeholder='e.g. For rent, travel, etc.'
                placeholderTextColor='#A3A3A3'
                className='text-[15px] text-black'
                multiline
              />
            </View>

            {/* Save */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className='bg-black rounded-2xl py-4 items-center'
            >
              {saving ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text className='text-white font-semibold text-[15px]'>Save</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
