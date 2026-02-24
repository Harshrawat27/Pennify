import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { getCurrencySymbol } from '@/lib/utils/currency';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';

  const categories = useQuery(api.categories.list, userId ? { userId } : 'skip');
  const accounts = useQuery(api.accounts.list, userId ? { userId } : 'skip');
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');
  const createTransaction = useMutation(api.transactions.create);

  const currency = prefs?.currency ?? 'INR';
  const trackIncome = prefs?.trackIncome ?? true;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isExpense, setIsExpense] = useState(true);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredCategories = (categories ?? []).filter((c) =>
    isExpense ? c.type === 'expense' : c.type === 'income'
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Auto-select first category / account when loaded
  const effectiveCategoryId =
    selectedCategoryId && filteredCategories.find((c) => c._id === selectedCategoryId)
      ? selectedCategoryId
      : filteredCategories[0]?._id ?? '';

  const effectiveAccountId =
    selectedAccountId && (accounts ?? []).find((a) => a._id === selectedAccountId)
      ? selectedAccountId
      : (accounts ?? [])[0]?._id ?? '';

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0 || !effectiveCategoryId || !effectiveAccountId) return;

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await createTransaction({
        userId,
        title: title.trim(),
        amount: isExpense ? -numAmount : numAmount,
        note: note.trim(),
        date: today,
        categoryId: effectiveCategoryId,
        accountId: effectiveAccountId,
      });
      router.back();
    } catch (e) {
      console.error('[AddTransaction] save failed:', e);
      setIsSaving(false);
    }
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
                key={cat._id}
                onPress={() => setSelectedCategoryId(cat._id)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl ${
                  effectiveCategoryId === cat._id ? 'bg-black' : 'bg-neutral-100'
                }`}
              >
                <Feather
                  name={cat.icon as any}
                  size={14}
                  color={effectiveCategoryId === cat._id ? '#fff' : '#000'}
                />
                <Text
                  className={`text-[13px] font-medium ${
                    effectiveCategoryId === cat._id ? 'text-white' : 'text-black'
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
            {(accounts ?? []).map((acc) => (
              <Pressable
                key={acc._id}
                onPress={() => setSelectedAccountId(acc._id)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl ${
                  effectiveAccountId === acc._id ? 'bg-black' : 'bg-neutral-100'
                }`}
              >
                <Feather
                  name={acc.icon as any}
                  size={14}
                  color={effectiveAccountId === acc._id ? '#fff' : '#000'}
                />
                <Text
                  className={`text-[13px] font-medium ${
                    effectiveAccountId === acc._id ? 'text-white' : 'text-black'
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
            disabled={isSaving || !title.trim() || !amount}
            className={`py-4 rounded-2xl items-center ${
              title.trim() && amount && !isSaving ? 'bg-black' : 'bg-neutral-300'
            }`}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-bold text-[16px]">Save Transaction</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
