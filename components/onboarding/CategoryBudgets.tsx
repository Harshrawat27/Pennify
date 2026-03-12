import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Keyboard, LayoutAnimation, Platform, Pressable, ScrollView, Text, TextInput, UIManager, View } from 'react-native';
import { DEFAULT_EXPENSE_CATEGORIES, PARENT_CATEGORIES, PARENT_CATEGORY_COLORS } from '@/lib/constants/categories';
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

type ViewMode = 'list' | 'category';

export function CategoryBudgets({ onNext, onBack }: CategoryBudgetsProps) {
  const categoryBudgets = useOnboardingStore((s) => s.categoryBudgets);
  const setCategoryBudgets = useOnboardingStore((s) => s.setCategoryBudgets);
  const currency = useOnboardingStore((s) => s.currency);
  const monthlyBudget = useOnboardingStore((s) => s.monthlyBudget);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showForm, setShowForm] = useState(false);
  const [selectedCat, setSelectedCat] = useState<(typeof DEFAULT_EXPENSE_CATEGORIES)[0] | null>(null);
  const [amount, setAmount] = useState('');
  const [catSearch, setCatSearch] = useState('');

  const currencySymbol = getCurrencySymbol(currency);
  const totalAllocated = categoryBudgets.reduce((s, b) => s + b.limitAmount, 0);

  const filteredCats = catSearch.trim()
    ? DEFAULT_EXPENSE_CATEGORIES.filter((c) =>
        c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
        c.parentCategory.toLowerCase().includes(catSearch.toLowerCase())
      )
    : DEFAULT_EXPENSE_CATEGORIES;

  const addBudget = () => {
    if (!selectedCat || !amount.trim()) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    const exists = categoryBudgets.some((b) => b.categoryName === selectedCat.name);
    if (exists) {
      // Update existing
      setCategoryBudgets(
        categoryBudgets.map((b) =>
          b.categoryName === selectedCat.name ? { ...b, limitAmount: num } : b
        )
      );
    } else {
      setCategoryBudgets([...categoryBudgets, { categoryName: selectedCat.name, limitAmount: num }]);
    }
    setSelectedCat(null);
    setAmount('');
    setShowForm(false);
    Keyboard.dismiss();
  };

  const removeBudget = (name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoryBudgets(categoryBudgets.filter((b) => b.categoryName !== name));
  };

  const getCatMeta = (name: string) =>
    DEFAULT_EXPENSE_CATEGORIES.find((c) => c.name === name);

  if (viewMode === 'category') {
    return (
      <View className='flex-1'>
        <View className='px-6 pt-4 pb-3 flex-row items-center gap-3 border-b border-neutral-100'>
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setViewMode('list');
              setCatSearch('');
            }}
            className='w-10 h-10 rounded-full bg-white items-center justify-center'
          >
            <Feather name='arrow-left' size={20} color='#000' />
          </Pressable>
          <Text className='flex-1 text-[18px] font-bold text-black'>Pick a Category</Text>
        </View>

        <View className='mx-4 mt-3 mb-2 bg-white rounded-2xl flex-row items-center px-4 gap-3'>
          <Feather name='search' size={15} color='#A3A3A3' />
          <TextInput
            value={catSearch}
            onChangeText={setCatSearch}
            placeholder='Search…'
            placeholderTextColor='#D4D4D4'
            className='flex-1 py-3 text-[14px] text-black'
            autoCapitalize='none'
          />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {PARENT_CATEGORIES.map((parent) => {
            const cats = filteredCats.filter((c) => c.parentCategory === parent);
            if (cats.length === 0) return null;
            const color = PARENT_CATEGORY_COLORS[parent];
            return (
              <View key={parent} className='mb-3'>
                <View className='flex-row items-center gap-2 mb-1.5 ml-1'>
                  <View className='w-1.5 h-1.5 rounded-full' style={{ backgroundColor: color }} />
                  <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider'>{parent}</Text>
                </View>
                {cats.map((cat) => {
                  const alreadySet = categoryBudgets.some((b) => b.categoryName === cat.name);
                  return (
                    <Pressable
                      key={cat.name}
                      onPress={() => {
                        setSelectedCat(cat);
                        const existing = categoryBudgets.find((b) => b.categoryName === cat.name);
                        setAmount(existing ? String(existing.limitAmount) : '');
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setViewMode('list');
                        setShowForm(true);
                        setCatSearch('');
                      }}
                      className='bg-white rounded-2xl p-3.5 mb-1.5 flex-row items-center gap-3'
                    >
                      <View
                        className='w-9 h-9 rounded-xl items-center justify-center'
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <Feather name={cat.icon as FeatherIcon} size={15} color={color} />
                      </View>
                      <Text className='flex-1 text-[14px] font-medium text-black'>{cat.name}</Text>
                      {alreadySet && <Feather name='check-circle' size={15} color='#000' />}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

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
            Set spending limits per category. Optional — you can always add more later.
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
              const meta = getCatMeta(b.categoryName);
              const color = meta?.color ?? '#6B7280';
              return (
                <View key={b.categoryName} className='bg-white rounded-2xl px-4 py-3.5 flex-row items-center gap-3'>
                  <View
                    className='w-9 h-9 rounded-xl items-center justify-center'
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Feather name={(meta?.icon ?? 'tag') as FeatherIcon} size={15} color={color} />
                  </View>
                  <View className='flex-1'>
                    <Text className='text-[14px] font-semibold text-black'>{b.categoryName}</Text>
                    <Text className='text-[12px] text-neutral-400'>{currencySymbol}{b.limitAmount.toLocaleString()}/mo</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setSelectedCat(meta ?? null);
                      setAmount(String(b.limitAmount));
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setShowForm(true);
                    }}
                    className='w-8 h-8 rounded-full bg-neutral-100 items-center justify-center mr-1'
                  >
                    <Feather name='edit-2' size={13} color='#A3A3A3' />
                  </Pressable>
                  <Pressable
                    onPress={() => removeBudget(b.categoryName)}
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
              {/* Category selector */}
              <Pressable
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setViewMode('category');
                }}
                className='flex-row items-center bg-neutral-50 rounded-xl px-4 py-3'
              >
                {selectedCat ? (
                  <>
                    <View
                      className='w-7 h-7 rounded-lg items-center justify-center mr-3'
                      style={{ backgroundColor: `${selectedCat.color}18` }}
                    >
                      <Feather name={selectedCat.icon as FeatherIcon} size={13} color={selectedCat.color} />
                    </View>
                    <Text className='flex-1 text-[14px] font-medium text-black'>{selectedCat.name}</Text>
                  </>
                ) : (
                  <Text className='flex-1 text-[14px] text-neutral-300'>Select category</Text>
                )}
                <Feather name='chevron-right' size={15} color='#D4D4D4' />
              </Pressable>

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
                  autoFocus={!!selectedCat}
                />
              </View>

              <View className='flex-row gap-2'>
                <Pressable
                  onPress={addBudget}
                  disabled={!selectedCat || !amount.trim()}
                  className='flex-1 py-3 rounded-xl items-center bg-black'
                  style={{ opacity: !selectedCat || !amount.trim() ? 0.35 : 1 }}
                >
                  <Text className='text-white font-bold text-[14px]'>Save</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setShowForm(false); setSelectedCat(null); setAmount(''); Keyboard.dismiss(); }}
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
