import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore, type RecurringPayment } from '@/lib/stores/useOnboardingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { BillingDayPicker } from '@/components/BillingDayPicker';

const COMMON_PAYMENTS = [
  'Netflix', 'Spotify', 'YouTube Premium', 'Gym',
  'Phone Bill', 'Internet', 'Electricity', 'Insurance',
];

interface RecurringPaymentsProps {
  onNext: () => void;
  onBack: () => void;
}

export function RecurringPayments({ onNext, onBack }: RecurringPaymentsProps) {
  const payments = useOnboardingStore((s) => s.recurringPayments);
  const setPayments = useOnboardingStore((s) => s.setRecurringPayments);
  const currency = useOnboardingStore((s) => s.currency);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFreq, setNewFreq] = useState<'monthly' | 'yearly'>('monthly');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const addPayment = () => {
    if (!newName.trim() || !newAmount.trim()) return;
    const billingDay = selectedDate ? Number(selectedDate.slice(8, 10)) : undefined;
    setPayments([
      ...payments,
      { name: newName.trim(), amount: newAmount.trim(), frequency: newFreq, billingDay, purchasedAt: selectedDate ?? undefined },
    ]);
    closeForm();
  };

  const closeForm = () => {
    setNewName('');
    setNewAmount('');
    setNewFreq('monthly');
    setSelectedDate(null);
    setShowCalendar(false);
    setShowAdd(false);
  };

  const openFormWithName = (name: string) => {
    if (payments.find((p) => p.name === name)) return;
    setNewName(name);
    setNewAmount('');
    setNewFreq('monthly');
    setSelectedDate(null);
    setShowCalendar(false);
    setShowAdd(true);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center mb-4">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[28px] font-bold text-black">
            Recurring payments
          </Text>
          <Text className="text-neutral-400 text-[15px] mt-2">
            Add subscriptions and bills you pay regularly.
          </Text>
        </View>

        {/* Quick add chips */}
        <View className="px-6 flex-row flex-wrap gap-2 mb-4">
          {COMMON_PAYMENTS.filter((p) => !payments.find((x) => x.name === p)).map((name) => (
            <Pressable
              key={name}
              onPress={() => openFormWithName(name)}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-white"
            >
              <Feather name="plus" size={12} color="#A3A3A3" />
              <Text className="text-[13px] text-black">{name}</Text>
            </Pressable>
          ))}
        </View>

        {/* Payment list */}
        <View className="mx-6 gap-3">
          {payments.map((p, i) => (
            <View key={i} className="bg-white rounded-2xl p-4 flex-row items-center">
              <View className="w-11 h-11 rounded-xl bg-neutral-100 items-center justify-center">
                <Feather name="repeat" size={18} color="#000" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-[15px] font-semibold text-black">{p.name}</Text>
                <Text className="text-[12px] text-neutral-400 mt-0.5">
                  {p.amount ? `${getCurrencySymbol(currency)}${p.amount}` : 'No amount set'} · {p.frequency}
                  {p.billingDay ? ` · ${p.billingDay}th` : ''}
                </Text>
              </View>
              <Pressable onPress={() => removePayment(i)} className="p-2">
                <Feather name="x" size={16} color="#A3A3A3" />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Add button */}
        <Pressable
          onPress={() => setShowAdd(true)}
          className="mx-6 mt-3 bg-white rounded-2xl p-4 flex-row items-center justify-center gap-2"
        >
          <Feather name="plus" size={18} color="#A3A3A3" />
          <Text className="text-[14px] font-medium text-neutral-400">Add Payment</Text>
        </Pressable>

        <View className="h-32" />
      </ScrollView>

      {/* Continue */}
      <View className="px-6 pb-10 pt-4 bg-neutral-50">
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl items-center bg-black"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">
            {payments.length > 0 ? `Continue (${payments.length} added)` : 'Continue'}
          </Text>
        </Pressable>
      </View>

      {/* Add Payment Modal */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={30}
        >
          <View className="flex-1 bg-neutral-50">
            {/* Handle + header */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-neutral-300" />
            </View>
            <View className="flex-row items-center justify-between px-6 py-4">
              <Text className="text-[20px] font-bold text-black">Add Payment</Text>
              <Pressable onPress={closeForm} className="w-9 h-9 rounded-full bg-white items-center justify-center">
                <Feather name="x" size={18} color="#000" />
              </Pressable>
            </View>

            <ScrollView
              className="flex-1 px-6"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Name */}
              <Text className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Name</Text>
              <View className="bg-white rounded-xl px-4 py-3 mb-5">
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g. Netflix, Rent..."
                  placeholderTextColor="#D4D4D4"
                  className="text-[16px] text-black"
                  autoFocus
                />
              </View>

              {/* Amount */}
              <Text className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Amount</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-5 gap-1">
                <Text className="text-[20px] font-bold text-black">{getCurrencySymbol(currency)}</Text>
                <TextInput
                  value={newAmount}
                  onChangeText={setNewAmount}
                  placeholder="0"
                  placeholderTextColor="#D4D4D4"
                  keyboardType="decimal-pad"
                  className="flex-1 text-[20px] font-bold text-black"
                />
              </View>

              {/* Frequency */}
              <Text className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Frequency</Text>
              <View className="flex-row gap-2 mb-5">
                <Pressable
                  onPress={() => setNewFreq('monthly')}
                  className={`flex-1 py-3 rounded-xl items-center ${newFreq === 'monthly' ? 'bg-black' : 'bg-white'}`}
                >
                  <Text className={`text-[13px] font-medium ${newFreq === 'monthly' ? 'text-white' : 'text-black'}`}>Monthly</Text>
                </Pressable>
                <Pressable
                  onPress={() => setNewFreq('yearly')}
                  className={`flex-1 py-3 rounded-xl items-center ${newFreq === 'yearly' ? 'bg-black' : 'bg-white'}`}
                >
                  <Text className={`text-[13px] font-medium ${newFreq === 'yearly' ? 'text-white' : 'text-black'}`}>Yearly</Text>
                </Pressable>
              </View>

              {/* Billing date */}
              <Pressable
                onPress={() => setShowCalendar(!showCalendar)}
                className="flex-row items-center gap-2 mb-2 py-1"
              >
                <Feather name={showCalendar ? 'chevron-up' : 'calendar'} size={14} color='#A3A3A3' />
                <Text className="text-[13px] text-neutral-400">
                  {selectedDate
                    ? `Purchased / renews on ${selectedDate.slice(8, 10)}/${selectedDate.slice(5, 7)}/${selectedDate.slice(0, 4)}`
                    : 'Set purchase or renewal date (optional)'}
                </Text>
              </Pressable>
              {!showCalendar && (
                <Text className="text-[11px] text-neutral-300 mb-3">
                  Pick when you bought it or just the day it renews each month
                </Text>
              )}
              {showCalendar && (
                <View className="mb-4">
                  <BillingDayPicker
                    selectedDate={selectedDate}
                    onSelect={(d) => setSelectedDate(d)}
                    onClear={() => setSelectedDate(null)}
                  />
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View className="px-6 pb-10 pt-3 flex-row gap-3">
              <Pressable
                onPress={closeForm}
                className="flex-1 py-3.5 rounded-2xl items-center bg-neutral-200"
              >
                <Text className="text-neutral-600 font-semibold text-[15px]">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={addPayment}
                disabled={!newName.trim() || !newAmount.trim()}
                className={`flex-1 py-3.5 rounded-2xl items-center ${newName.trim() && newAmount.trim() ? 'bg-black' : 'bg-neutral-300'}`}
              >
                <Text className="text-[15px] font-bold text-white">Add</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
