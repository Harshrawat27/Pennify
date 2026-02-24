import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { getCurrencySymbol } from '@/lib/utils/currency';

export default function AddBudgetScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';

  const categories = useQuery(api.categories.listByType, userId ? { userId, type: 'expense' } : 'skip');
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');
  const createBudget = useMutation(api.budgets.create);

  const currency = prefs?.currency ?? 'INR';

  const [limit, setLimit] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const effectiveCategoryId =
    selectedCategoryId && (categories ?? []).find((c) => c._id === selectedCategoryId)
      ? selectedCategoryId
      : (categories ?? [])[0]?._id ?? '';

  const handleSave = async () => {
    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit <= 0 || !effectiveCategoryId) return;

    setIsSaving(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      await createBudget({
        userId,
        categoryId: effectiveCategoryId,
        limitAmount: numLimit,
        month: currentMonth,
      });
      router.back();
    } catch (e) {
      console.error('[AddBudget] save failed:', e);
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
          <Text className="text-[18px] font-bold text-black">Add Budget</Text>
          <View className="w-10" />
        </View>

        {/* Limit Amount */}
        <View className="mx-6 mt-6 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Monthly Limit</Text>
          <View className="flex-row items-center">
            <Text className="text-[32px] font-bold text-black mr-1">{getCurrencySymbol(currency)}</Text>
            <TextInput
              value={limit}
              onChangeText={setLimit}
              placeholder="0"
              placeholderTextColor="#D4D4D4"
              keyboardType="decimal-pad"
              className="flex-1 text-[32px] font-bold text-black"
            />
          </View>
        </View>

        {/* Category Picker */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {(categories ?? []).map((cat) => (
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

        {/* Save Button */}
        <View className="mx-6 mt-6">
          <Pressable
            onPress={handleSave}
            disabled={isSaving || !limit}
            className={`py-4 rounded-2xl items-center ${
              limit && !isSaving ? 'bg-black' : 'bg-neutral-300'
            }`}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-bold text-[16px]">Save Budget</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
