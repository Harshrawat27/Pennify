import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useCachedAccounts } from '@/lib/hooks/useCachedAccounts';
import { useCachedCategories } from '@/lib/hooks/useCachedCategories';
import { enqueue, type QueuedTransaction } from '@/lib/offlineQueue';
import { usePendingStore } from '@/lib/stores/usePendingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { localDateString } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react'; // still needed for prefs (currency, trackIncome)

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';

  // Cached: loads instantly from AsyncStorage, syncs with Convex in background
  const accounts = useCachedAccounts();
  const allCategories = useCachedCategories();

  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');
  const currency = prefs?.currency ?? 'INR';
  const trackIncome = prefs?.trackIncome ?? true;

  const addPending = usePendingStore((s) => s.add);
  const requestSync = usePendingStore((s) => s.requestSync);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isExpense, setIsExpense] = useState(true);
  const [note, setNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const filteredCategories = allCategories.filter((c) =>
    isExpense ? c.type === 'expense' : c.type === 'income'
  );

  const effectiveCategoryId =
    selectedCategoryId && filteredCategories.find((c) => c._id === selectedCategoryId)
      ? selectedCategoryId
      : filteredCategories[0]?._id ?? '';

  const effectiveAccountId =
    selectedAccountId && accounts.find((a) => a._id === selectedAccountId)
      ? selectedAccountId
      : accounts[0]?._id ?? '';

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0 || !effectiveCategoryId || !effectiveAccountId) return;
    if (!userId) return;

    const today = localDateString(); // device local date, not UTC
    const localId = Crypto.randomUUID();

    const selectedCategory = filteredCategories.find((c) => c._id === effectiveCategoryId);
    const selectedAccount = accounts.find((a) => a._id === effectiveAccountId);

    const pending: QueuedTransaction = {
      localId,
      userId,
      title: title.trim(),
      amount: isExpense ? -numAmount : numAmount,
      note: note.trim(),
      date: today,
      categoryId: effectiveCategoryId,
      accountId: effectiveAccountId,
      categoryName: selectedCategory?.name ?? '',
      categoryIcon: selectedCategory?.icon ?? 'tag',
      accountName: selectedAccount?.name ?? '',
      accountIcon: selectedAccount?.icon ?? 'credit-card',
      createdAt: new Date().toISOString(),
      retries: 0,
    };

    // 1. Show in UI immediately
    addPending(pending);
    // 2. Persist to AsyncStorage (survives app close)
    await enqueue(pending);
    // 3. Go back — user sees it instantly in home list
    router.back();
    // 4. Signal the background sync hook (in CustomTabBar) to flush now
    requestSync();
  };

  const canSave = !!title.trim() && !!amount;

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
          {filteredCategories.length === 0 ? (
            <Text className="text-neutral-300 text-[14px]">Loading categories…</Text>
          ) : (
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
          )}
        </View>

        {/* Account Picker */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Account</Text>
          {accounts.length === 0 ? (
            <Text className="text-neutral-300 text-[14px]">Loading accounts…</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {accounts.map((acc) => (
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
          )}
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
            disabled={!canSave}
            className={`py-4 rounded-2xl items-center ${canSave ? 'bg-black' : 'bg-neutral-300'}`}
          >
            <Text className="text-white font-bold text-[16px]">Save Transaction</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
