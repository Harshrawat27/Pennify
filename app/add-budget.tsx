import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBudgetStore } from '@/lib/stores/useBudgetStore';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { getCategoriesByType } from '@/lib/dal';
import type { Category } from '@/lib/models/types';

export default function AddBudgetScreen() {
  const insets = useSafeAreaInsets();
  const addBudget = useBudgetStore((s) => s.addBudget);
  const currency = useSettingsStore((s) => s.currency);

  const [limit, setLimit] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  useEffect(() => {
    const cats = getCategoriesByType('expense');
    setCategories(cats);
    if (cats.length > 0) setSelectedCategoryId(cats[0].id);
  }, []);

  const handleSave = () => {
    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit <= 0 || !selectedCategoryId) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    addBudget({
      category_id: selectedCategoryId,
      limit_amount: numLimit,
      month: currentMonth,
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
            {categories.map((cat) => (
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

        {/* Save Button */}
        <View className="mx-6 mt-6">
          <Pressable
            onPress={handleSave}
            className={`py-4 rounded-2xl items-center ${
              limit ? 'bg-black' : 'bg-neutral-300'
            }`}
          >
            <Text className="text-white font-bold text-[16px]">Save Budget</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
