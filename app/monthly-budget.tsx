import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useAuthenticatedUserId } from '@/lib/hooks/useAuthenticatedUserId';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/currency';
import { currentMonth, formatMonthLabel, prevMonth } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
export default function MonthlyBudgetScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const authenticatedUserId = useAuthenticatedUserId();

  const month = currentMonth();
  const budget = useQuery(api.monthlyBudgets.getByMonth, authenticatedUserId ? { userId: authenticatedUserId, month } : 'skip');
  const prevBudget = useQuery(api.monthlyBudgets.getByMonth, authenticatedUserId ? { userId: authenticatedUserId, month: prevMonth(month) } : 'skip');
  const prefs = useQuery(api.preferences.get, authenticatedUserId ? { userId: authenticatedUserId } : 'skip');
  const upsert = useMutation(api.monthlyBudgets.upsert);

  const currency = prefs?.currency ?? 'INR';
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Pre-fill with current month's budget, or fall back to previous month's
  useEffect(() => {
    const value = budget?.budget ?? prevBudget?.budget;
    if (value != null) setAmount(String(value));
  }, [budget?.budget, prevBudget?.budget]);

  const currentBudget = budget?.budget ?? prevBudget?.budget ?? 0;
  const numAmount = parseFloat(amount);
  const canSave = !isNaN(numAmount) && numAmount > 0 && numAmount !== currentBudget && !isSaving;

  const handleSave = async () => {
    if (!userId || !canSave) return;
    setIsSaving(true);
    try {
      await upsert({ userId, month, budget: numAmount });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center"
          >
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[20px] font-bold text-black">Monthly Budget</Text>
        </View>

        {/* Current month banner */}
        <View className="mx-6 mb-5 bg-black rounded-2xl p-5">
          <Text className="text-neutral-400 text-[13px]">{formatMonthLabel(month)}</Text>
          <Text className="text-white text-[32px] font-bold tracking-tight mt-1">
            {currentBudget > 0 ? formatCurrency(currentBudget, currency) : '—'}
          </Text>
          <Text className="text-neutral-500 text-[12px] mt-1">Current budget</Text>
        </View>

        {/* Edit section */}
        <View className="mx-6">
          <Text className="text-[13px] font-medium text-neutral-500 mb-2">
            Set new budget
          </Text>

          <View className="bg-white rounded-2xl px-4 py-3 flex-row items-center gap-2 mb-3">
            <Text className="text-[22px] font-bold text-neutral-300">
              {getCurrencySymbol(currency)}
            </Text>
            <TextInput
              value={amount}
              onChangeText={(t) => { setSaved(false); setAmount(t); }}
              placeholder="0"
              placeholderTextColor="#D4D4D4"
              keyboardType="numeric"
              className="flex-1 text-[28px] font-bold text-black"
              autoFocus
            />
          </View>

          {/* Hint */}
          <View className="bg-neutral-100 rounded-xl px-4 py-3 mb-6 flex-row items-center gap-2">
            <Feather name="info" size={13} color="#A3A3A3" />
            <Text className="flex-1 text-[12px] text-neutral-500 leading-5">
              This budget applies from {formatMonthLabel(month)} onwards. It will be automatically carried forward every month until you change it.
            </Text>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={`py-4 rounded-2xl items-center ${canSave ? 'bg-black' : 'bg-neutral-200'}`}
          >
            <Text className={`text-[15px] font-bold ${canSave ? 'text-white' : 'text-neutral-400'}`}>
              {saved ? '✓ Saved' : isSaving ? 'Saving…' : 'Save Budget'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
