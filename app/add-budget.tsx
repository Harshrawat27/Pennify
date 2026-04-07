import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useAuthenticatedUserId } from '@/lib/hooks/useAuthenticatedUserId';
import { useCachedParentCategories } from '@/lib/hooks/useCachedParentCategories';
import { useCachedCurrency } from '@/lib/hooks/useCachedCurrency';
import type { FeatherIcon } from '@/lib/models/types';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function AddBudgetScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';
  const authenticatedUserId = useAuthenticatedUserId();

  const parentCategories = useCachedParentCategories();
  const prefs = useQuery(
    api.preferences.get,
    authenticatedUserId ? { userId: authenticatedUserId } : 'skip'
  );
  const createBudget = useMutation(api.budgets.create);

  const currency = useCachedCurrency();

  const [limit, setLimit] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const effectiveParentId =
    selectedParentId && parentCategories.find((p) => p._id === selectedParentId)
      ? selectedParentId
      : (parentCategories[0]?._id ?? '');

  const handleSave = async () => {
    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit <= 0 || !effectiveParentId) return;

    setIsSaving(true);
    try {
      const d = new Date();
      const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      await createBudget({
        userId,
        parentCategoryId: effectiveParentId as any,
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
      className='flex-1 bg-neutral-50'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Header */}
        <View className='px-6 pt-4 pb-2 flex-row justify-between items-center'>
          <Pressable
            onPress={() => router.back()}
            className='w-10 h-10 rounded-full bg-white items-center justify-center'
          >
            <Feather name='x' size={20} color='#000' />
          </Pressable>
          <Text className='text-[18px] font-bold text-black'>Add Budget</Text>
          <View className='w-10' />
        </View>

        {/* Limit Amount */}
        <View className='mx-6 mt-6 bg-white rounded-2xl p-5'>
          <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>
            Monthly Limit
          </Text>
          <View className='flex-row items-center'>
            <Text className='text-[32px] font-bold text-black mr-1'>
              {getCurrencySymbol(currency)}
            </Text>
            <TextInput
              value={limit}
              onChangeText={setLimit}
              placeholder='0'
              placeholderTextColor='#D4D4D4'
              keyboardType='decimal-pad'
              className='flex-1 text-[32px] font-bold text-black'
              autoFocus
            />
          </View>
        </View>

        {/* Category Group Picker */}
        <View className='mx-6 mt-4 bg-white rounded-2xl p-5'>
          <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>
            Category Group
          </Text>
          <View className='flex-row flex-wrap gap-2'>
            {parentCategories.map((parent) => {
              const selected = effectiveParentId === parent._id;
              return (
                <Pressable
                  key={parent._id}
                  onPress={() => setSelectedParentId(parent._id)}
                  className={`flex-row items-center gap-2 px-3 py-2.5 rounded-xl ${selected ? 'bg-black' : 'bg-neutral-100'}`}
                >
                  <Feather
                    name={parent.icon as FeatherIcon}
                    size={13}
                    color={selected ? '#fff' : parent.color}
                  />
                  <Text
                    className={`text-[13px] font-medium ${selected ? 'text-white' : 'text-black'}`}
                  >
                    {parent.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <View className='mx-6 mt-6'>
          <Pressable
            onPress={handleSave}
            disabled={isSaving || !limit}
            className={`py-4 rounded-2xl items-center ${
              limit && !isSaving ? 'bg-black' : 'bg-neutral-300'
            }`}
          >
            {isSaving ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <Text className='text-white font-bold text-[16px]'>
                Save Budget
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
