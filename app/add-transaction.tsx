import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTransactionStore } from '@/lib/stores/useTransactionStore';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { getAllCategories, getAllAccounts } from '@/lib/dal';
import type { Category, Account } from '@/lib/models/types';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const currency = useSettingsStore((s) => s.currency);
  const trackIncome = useSettingsStore((s) => s.trackIncome);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isExpense, setIsExpense] = useState(true);
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    const cats = getAllCategories();
    const accts = getAllAccounts();
    setCategories(cats);
    setAccounts(accts);
    // Default selections
    const expenseCats = cats.filter((c) => c.type === 'expense');
    if (expenseCats.length > 0) setSelectedCategoryId(expenseCats[0].id);
    if (accts.length > 0) setSelectedAccountId(accts[0].id);
  }, []);

  const filteredCategories = categories.filter((c) =>
    isExpense ? c.type === 'expense' : c.type === 'income'
  );

  // Update selected category when toggling expense/income
  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(filteredCategories[0].id);
    }
  }, [isExpense, filteredCategories, selectedCategoryId]);

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0 || !selectedCategoryId || !selectedAccountId) return;

    const today = new Date().toISOString().split('T')[0];
    addTransaction({
      title: title.trim(),
      amount: isExpense ? -numAmount : numAmount,
      note: note.trim(),
      date: today,
      category_id: selectedCategoryId,
      account_id: selectedAccountId,
    });

    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center">
            <Feather name="x" size={20} color="#000" />
          </Pressable>
          <Text className="text-[18px] font-bold text-black">Add Transaction</Text>
          <View className="w-10" />
        </View>

        {/* Expense / Income Toggle */}
        {trackIncome ? (
          <View className="flex-row mx-6 mt-5 bg-white rounded-xl p-1">
            <Pressable
              onPress={() => setIsExpense(true)}
              className={`flex-1 py-3 rounded-lg items-center ${isExpense ? 'bg-black' : ''}`}
            >
              <Text className={`text-[14px] font-semibold ${isExpense ? 'text-white' : 'text-neutral-400'}`}>
                Expense
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsExpense(false)}
              className={`flex-1 py-3 rounded-lg items-center ${!isExpense ? 'bg-black' : ''}`}
            >
              <Text className={`text-[14px] font-semibold ${!isExpense ? 'text-white' : 'text-neutral-400'}`}>
                Income
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Amount */}
        <View className="mx-6 mt-6 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Amount</Text>
          <View className="flex-row items-center">
            <Text className="text-[32px] font-bold text-black mr-1">{getCurrencySymbol(currency)}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#D4D4D4"
              keyboardType="decimal-pad"
              className="flex-1 text-[32px] font-bold text-black"
            />
          </View>
        </View>

        {/* Title */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Coffee, Salary..."
            placeholderTextColor="#D4D4D4"
            className="text-[16px] text-black"
          />
        </View>

        {/* Category Picker */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {filteredCategories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategoryId(cat.id)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl ${
                  selectedCategoryId === cat.id ? 'bg-black' : 'bg-neutral-100'
                }`}
              >
                <Feather
                  name={cat.icon}
                  size={14}
                  color={selectedCategoryId === cat.id ? '#fff' : '#000'}
                />
                <Text
                  className={`text-[13px] font-medium ${
                    selectedCategoryId === cat.id ? 'text-white' : 'text-black'
                  }`}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Account Picker */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Account</Text>
          <View className="flex-row flex-wrap gap-2">
            {accounts.map((acc) => (
              <Pressable
                key={acc.id}
                onPress={() => setSelectedAccountId(acc.id)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl ${
                  selectedAccountId === acc.id ? 'bg-black' : 'bg-neutral-100'
                }`}
              >
                <Feather
                  name={acc.icon}
                  size={14}
                  color={selectedAccountId === acc.id ? '#fff' : '#000'}
                />
                <Text
                  className={`text-[13px] font-medium ${
                    selectedAccountId === acc.id ? 'text-white' : 'text-black'
                  }`}
                >
                  {acc.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Note */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note..."
            placeholderTextColor="#D4D4D4"
            className="text-[16px] text-black"
            multiline
          />
        </View>

        {/* Save Button */}
        <View className="mx-6 mt-6">
          <Pressable
            onPress={handleSave}
            className={`py-4 rounded-2xl items-center ${
              title.trim() && amount ? 'bg-black' : 'bg-neutral-300'
            }`}
          >
            <Text className="text-white font-bold text-[16px]">Save Transaction</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
