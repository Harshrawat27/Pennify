import { DEFAULT_PARENT_CATEGORIES } from '@/lib/constants/categories';
import type { FeatherIcon } from '@/lib/models/types';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

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
  const [selectedParent, setSelectedParent] = useState<
    (typeof DEFAULT_PARENT_CATEGORIES)[0] | null
  >(null);
  const [amount, setAmount] = useState('');

  const currencySymbol = getCurrencySymbol(currency);
  const totalAllocated = categoryBudgets.reduce((s, b) => s + b.limitAmount, 0);

  const addBudget = () => {
    if (!selectedParent || !amount.trim()) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    const exists = categoryBudgets.some(
      (b) => b.parentCategoryName === selectedParent.name
    );
    if (exists) {
      setCategoryBudgets(
        categoryBudgets.map((b) =>
          b.parentCategoryName === selectedParent.name
            ? { ...b, limitAmount: num }
            : b
        )
      );
    } else {
      setCategoryBudgets([
        ...categoryBudgets,
        { parentCategoryName: selectedParent.name, limitAmount: num },
      ]);
    }
    setSelectedParent(null);
    setAmount('');
    setShowForm(false);
    Keyboard.dismiss();
  };

  const removeBudget = (name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoryBudgets(
      categoryBudgets.filter((b) => b.parentCategoryName !== name)
    );
  };

  const getParentMeta = (name: string) =>
    DEFAULT_PARENT_CATEGORIES.find((p) => p.name === name);

  const closeForm = () => {
    setShowForm(false);
    setSelectedParent(null);
    setAmount('');
    Keyboard.dismiss();
  };

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
          <Text className='text-[28px] font-bold text-black'>
            Category Budgets
          </Text>
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
                {currencySymbol}
                {totalAllocated.toLocaleString()} allocated of {currencySymbol}
                {monthlyBudget.toLocaleString()} monthly budget
              </Text>
              <View className='h-1 bg-neutral-100 rounded-full mt-1.5'>
                <View
                  className='h-1 rounded-full bg-black'
                  style={{
                    width: `${Math.min((totalAllocated / monthlyBudget) * 100, 100)}%`,
                  }}
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
                <View
                  key={b.parentCategoryName}
                  className='bg-white rounded-2xl px-4 py-3.5 flex-row items-center gap-3'
                >
                  <View
                    className='w-9 h-9 rounded-xl items-center justify-center'
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Feather
                      name={(meta?.icon ?? 'tag') as FeatherIcon}
                      size={15}
                      color={color}
                    />
                  </View>
                  <View className='flex-1'>
                    <Text className='text-[14px] font-semibold text-black'>
                      {b.parentCategoryName}
                    </Text>
                    <Text className='text-[12px] text-neutral-400'>
                      {currencySymbol}
                      {b.limitAmount.toLocaleString()}/mo
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setSelectedParent(meta ?? null);
                      setAmount(String(b.limitAmount));
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

        {/* Add button */}
        <View className='px-6'>
          <Pressable
            onPress={() => setShowForm(true)}
            className='flex-row items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-dashed border-neutral-300 self-start'
          >
            <Feather name='plus' size={14} color='#A3A3A3' />
            <Text className='text-[13px] font-medium text-neutral-400'>
              Add category budget
            </Text>
          </Pressable>
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

      {/* Add / Edit Modal */}
      <Modal
        visible={showForm}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={30}
        >
          <View className='flex-1 bg-neutral-50'>
            {/* Handle + header */}
            <View className='items-center pt-3 pb-1'>
              <View className='w-10 h-1 rounded-full bg-neutral-300' />
            </View>
            <View className='flex-row items-center justify-between px-6 py-4'>
              <Text className='text-[20px] font-bold text-black'>
                {selectedParent &&
                categoryBudgets.some(
                  (b) => b.parentCategoryName === selectedParent.name
                )
                  ? 'Edit Budget'
                  : 'Add Category Budget'}
              </Text>
              <Pressable
                onPress={closeForm}
                className='w-9 h-9 rounded-full bg-white items-center justify-center'
              >
                <Feather name='x' size={18} color='#000' />
              </Pressable>
            </View>

            <ScrollView
              className='flex-1 px-6'
              keyboardShouldPersistTaps='handled'
              showsVerticalScrollIndicator={false}
            >
              {/* Parent category grid */}
              <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3'>
                Category Group
              </Text>
              <View className='flex-row flex-wrap gap-2 mb-5'>
                {DEFAULT_PARENT_CATEGORIES.map((parent) => {
                  const selected = selectedParent?.name === parent.name;
                  const alreadySet =
                    !selected &&
                    categoryBudgets.some(
                      (b) => b.parentCategoryName === parent.name
                    );
                  return (
                    <Pressable
                      key={parent.name}
                      onPress={() => setSelectedParent(parent)}
                      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${selected ? 'bg-black' : 'bg-white'}`}
                    >
                      <Feather
                        name={parent.icon as FeatherIcon}
                        size={11}
                        color={selected ? '#fff' : parent.color}
                      />
                      <Text
                        className={`text-[12px] font-medium ${selected ? 'text-white' : 'text-black'}`}
                      >
                        {parent.name}
                      </Text>
                      {alreadySet && (
                        <Feather
                          name='check'
                          size={10}
                          color={selected ? '#fff' : '#A3A3A3'}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Amount input */}
              <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3'>
                Monthly Limit
              </Text>
              <View className='flex-row items-center bg-white rounded-xl px-4 py-3 gap-2 mb-6'>
                <Text className='text-[18px] font-bold text-neutral-300'>
                  {currencySymbol}
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder='0'
                  placeholderTextColor='#D4D4D4'
                  keyboardType='number-pad'
                  className='flex-1 text-[18px] font-bold text-black'
                  autoFocus={!!selectedParent}
                />
              </View>
            </ScrollView>

            {/* Actions */}
            <View className='px-6 pb-10 pt-3 flex-row gap-3'>
              <Pressable
                onPress={closeForm}
                className='flex-1 py-3.5 rounded-2xl items-center bg-neutral-200'
              >
                <Text className='text-neutral-600 font-semibold text-[15px]'>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={addBudget}
                disabled={!selectedParent || !amount.trim()}
                className='flex-1 py-3.5 rounded-2xl items-center bg-black'
                style={{
                  opacity: !selectedParent || !amount.trim() ? 0.35 : 1,
                }}
              >
                <Text className='text-white font-bold text-[15px]'>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
