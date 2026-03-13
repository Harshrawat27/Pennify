import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Keyboard, LayoutAnimation, Platform, Pressable, ScrollView, Text, TextInput, UIManager, View } from 'react-native';
import { DEFAULT_PARENT_CATEGORIES } from '@/lib/constants/categories';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import type { FeatherIcon } from '@/lib/models/types';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface CategoryBudgetsProps {
  onNext: () => void;
  onBack: () => void;
}

export function CategoryBudgets({ onNext, onBack }: CategoryBudgetsProps) {
  const categoryBudgets = useOnboardingStore((s) => s.categoryBudgets);
  const setCategoryBudgets = useOnboardingStore((s) => s.setCategoryBudgets);
  const currency = useOnboardingStore((s) => s.currency);
  const monthlyBudget = useOnboardingStore((s) => s.monthlyBudget);

  const [showForm, setShowForm] = useState(false);
  const [selectedParent, setSelectedParent] = useState<(typeof DEFAULT_PARENT_CATEGORIES)[0] | null>(null);
  const [amount, setAmount] = useState('');

  const currencySymbol = getCurrencySymbol(currency);
  const totalAllocated = categoryBudgets.reduce((s, b) => s + b.limitAmount, 0);

  const addBudget = () => {
    if (!selectedParent || !amount.trim()) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    const exists = categoryBudgets.some((b) => b.parentCategoryName === selectedParent.name);
    if (exists) {
      setCategoryBudgets(
        categoryBudgets.map((b) =>
          b.parentCategoryName === selectedParent.name ? { ...b, limitAmount: num } : b
        )
      );
    } else {
      setCategoryBudgets([...categoryBudgets, { parentCategoryName: selectedParent.name, limitAmount: num }]);
    }
    setSelectedParent(null);
    setAmount('');
    setShowForm(false);
    Keyboard.dismiss();
  };

  const removeBudget = (name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoryBudgets(categoryBudgets.filter((b) => b.parentCategoryName !== name));
  };

  const getParentMeta = (name: string) =>
    DEFAULT_PARENT_CATEGORIES.find((p) => p.name === name);

  return (
    <View className='flex-1'>
      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Header */}
        <View className='px-6 pt-2 pb-4'>
          <Pressable
            onPress={onBack}
            className='w-10 h-10 rounded-full bg-white items-center justify-center mb-4'
          >
            <Feather name='arrow-left' size={20} color='#000' />
          </Pressable>
          <Text className='text-[28px] font-bold text-black'>Category Budgets</Text>
          <Text className='text-neutral-400 text-[15px] mt-2'>
            Set spending limits per category group. Optional — add more later.
          </Text>
        </View>

        {/* Allocation summary */}
        {monthlyBudget > 0 && (
          <View className='mx-6 mb-4 bg-white rounded-2xl px-4 py-3 flex-row items-center gap-3'>
            <Feather name='pie-chart' size={15} color='#A3A3A3' />
            <View className='flex-1'>
              <Text className='text-[12px] text-neutral-400'>
                {currencySymbol}{totalAllocated.toLocaleString()} allocated of {currencySymbol}{monthlyBudget.toLocaleString()} monthly budget
              </Text>
              <View className='h-1 bg-neutral-100 rounded-full mt-1.5'>
                <View
                  className='h-1 rounded-full bg-black'
                  style={{ width: `${Math.min((totalAllocated / monthlyBudget) * 100, 100)}%` }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Set budgets list */}
        {categoryBudgets.length > 0 && (
          <View className='px-6 mb-3 gap-2'>
            {categoryBudgets.map((b) => {
              const meta = getParentMeta(b.parentCategoryName);
              const color = meta?.color ?? '#6B7280';
              return (
                <View key={b.parentCategoryName} className='bg-white rounded-2xl px-4 py-3.5 flex-row items-center gap-3'>
                  <View
                    className='w-9 h-9 rounded-xl items-center justify-center'
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Feather name={(meta?.icon ?? 'tag') as FeatherIcon} size={15} color={color} />
                  </View>
                  <View className='flex-1'>
                    <Text className='text-[14px] font-semibold text-black'>{b.parentCategoryName}</Text>
                    <Text className='text-[12px] text-neutral-400'>{currencySymbol}{b.limitAmount.toLocaleString()}/mo</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setSelectedParent(meta ?? null);
                      setAmount(String(b.limitAmount));
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setShowForm(true);
                    }}
                    className='w-8 h-8 rounded-full bg-neutral-100 items-center justify-center mr-1'
                  >
                    <Feather name='edit-2' size={13} color='#A3A3A3' />
                  </Pressable>
                  <Pressable
                    onPress={() => removeBudget(b.parentCategoryName)}
                    className='w-8 h-8 rounded-full bg-neutral-100 items-center justify-center'
                  >
                    <Feather name='trash-2' size={13} color='#A3A3A3' />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* Add form */}
        <View className='px-6'>
          {showForm ? (
            <View className='bg-white rounded-2xl p-4 gap-3'>
              {/* Parent category grid */}
              <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider'>
                Category Group
              </Text>
              <View className='flex-row flex-wrap gap-2'>
                {DEFAULT_PARENT_CATEGORIES.map((parent) => {
                  const selected = selectedParent?.name === parent.name;
                  const alreadySet = !selected && categoryBudgets.some((b) => b.parentCategoryName === parent.name);
                  return (
                    <Pressable
                      key={parent.name}
                      onPress={() => setSelectedParent(parent)}
                      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${selected ? 'bg-black' : 'bg-neutral-100'}`}
                    >
                      <Feather
                        name={parent.icon as FeatherIcon}
                        size={11}
                        color={selected ? '#fff' : parent.color}
                      />
                      <Text className={`text-[12px] font-medium ${selected ? 'text-white' : 'text-black'}`}>
                        {parent.name}
                      </Text>
                      {alreadySet && <Feather name='check' size={10} color={selected ? '#fff' : '#A3A3A3'} />}
                    </Pressable>
                  );
                })}
              </View>

              {/* Amount input */}
              <View className='flex-row items-center bg-neutral-50 rounded-xl px-4 py-3 gap-2'>
                <Text className='text-[18px] font-bold text-neutral-300'>{currencySymbol}</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder='Monthly limit'
                  placeholderTextColor='#D4D4D4'
                  keyboardType='number-pad'
                  className='flex-1 text-[18px] font-bold text-black'
                  autoFocus={!!selectedParent}
                />
              </View>

              <View className='flex-row gap-2'>
                <Pressable
                  onPress={addBudget}
                  disabled={!selectedParent || !amount.trim()}
                  className='flex-1 py-3 rounded-xl items-center bg-black'
                  style={{ opacity: !selectedParent || !amount.trim() ? 0.35 : 1 }}
                >
                  <Text className='text-white font-bold text-[14px]'>Save</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setShowForm(false); setSelectedParent(null); setAmount(''); Keyboard.dismiss(); }}
                  className='flex-1 py-3 rounded-xl items-center bg-neutral-100'
                >
                  <Text className='text-neutral-500 font-medium text-[14px]'>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowForm(true);
              }}
              className='flex-row items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-dashed border-neutral-300 self-start'
            >
              <Feather name='plus' size={14} color='#A3A3A3' />
              <Text className='text-[13px] font-medium text-neutral-400'>Add category budget</Text>
            </Pressable>
          )}
        </View>

        <View className='h-32' />
      </ScrollView>

      {/* Continue */}
      <View className='px-6 pb-10 pt-4 bg-neutral-50'>
        <Pressable
          onPress={onNext}
          className='py-4 rounded-2xl items-center bg-black'
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className='text-white font-bold text-[16px]'>
            {categoryBudgets.length > 0 ? 'Continue' : 'Skip for now'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
