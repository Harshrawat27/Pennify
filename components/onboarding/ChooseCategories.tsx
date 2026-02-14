import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';
import type { FeatherIcon } from '@/lib/models/types';

const DEFAULT_CATEGORIES: { name: string; icon: FeatherIcon }[] = [
  { name: 'Food & Dining', icon: 'shopping-bag' },
  { name: 'Transport', icon: 'navigation' },
  { name: 'Entertainment', icon: 'play-circle' },
  { name: 'Shopping', icon: 'shopping-cart' },
  { name: 'Bills & Utilities', icon: 'zap' },
  { name: 'Health', icon: 'heart' },
  { name: 'Education', icon: 'book' },
  { name: 'Subscriptions', icon: 'refresh-cw' },
  { name: 'Groceries', icon: 'package' },
  { name: 'Rent', icon: 'home' },
  { name: 'Insurance', icon: 'shield' },
  { name: 'Personal Care', icon: 'smile' },
  { name: 'Gifts', icon: 'gift' },
  { name: 'Travel', icon: 'map' },
];

interface ChooseCategoriesProps {
  onNext: () => void;
  onBack: () => void;
}

export function ChooseCategories({ onNext, onBack }: ChooseCategoriesProps) {
  const selectedCategories = useOnboardingStore((s) => s.selectedCategories);
  const setSelectedCategories = useOnboardingStore((s) => s.setSelectedCategories);
  const customCategories = useOnboardingStore((s) => s.customCategories);
  const setCustomCategories = useOnboardingStore((s) => s.setCustomCategories);
  const [customInput, setCustomInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const toggleCategory = (name: string) => {
    if (selectedCategories.includes(name)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== name));
    } else {
      setSelectedCategories([...selectedCategories, name]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      setCustomCategories([...customCategories, trimmed]);
    }
    if (!selectedCategories.includes(trimmed)) {
      setSelectedCategories([...selectedCategories, trimmed]);
    }
    setCustomInput('');
    setShowInput(false);
  };

  const totalSelected = selectedCategories.length;

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center mb-4">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[28px] font-bold text-black">
            Spending categories
          </Text>
          <Text className="text-neutral-400 text-[15px] mt-2">
            Pick the categories you spend on. Select at least one.
          </Text>
        </View>

        {/* Category pills */}
        <View className="px-6 flex-row flex-wrap gap-2">
          {DEFAULT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat.name);
            return (
              <Pressable
                key={cat.name}
                onPress={() => toggleCategory(cat.name)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl ${
                  isSelected ? 'bg-black' : 'bg-white'
                }`}
              >
                <Feather name={cat.icon} size={14} color={isSelected ? '#fff' : '#000'} />
                <Text className={`text-[13px] font-medium ${isSelected ? 'text-white' : 'text-black'}`}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}

          {/* Custom categories */}
          {customCategories.map((name) => {
            const isSelected = selectedCategories.includes(name);
            return (
              <Pressable
                key={name}
                onPress={() => toggleCategory(name)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl ${
                  isSelected ? 'bg-black' : 'bg-white'
                }`}
              >
                <Feather name="tag" size={14} color={isSelected ? '#fff' : '#000'} />
                <Text className={`text-[13px] font-medium ${isSelected ? 'text-white' : 'text-black'}`}>
                  {name}
                </Text>
              </Pressable>
            );
          })}

          {/* Add custom */}
          {showInput ? (
            <View className="flex-row items-center bg-white rounded-xl px-3 py-1.5 gap-2">
              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                placeholder="Category name"
                placeholderTextColor="#A3A3A3"
                className="text-[13px] text-black min-w-[100px]"
                autoFocus
                onSubmitEditing={addCustom}
                returnKeyType="done"
              />
              <Pressable onPress={addCustom} className="p-1">
                <Feather name="check" size={16} color="#000" />
              </Pressable>
              <Pressable onPress={() => { setShowInput(false); setCustomInput(''); }} className="p-1">
                <Feather name="x" size={16} color="#A3A3A3" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowInput(true)}
              className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-dashed border-neutral-300"
            >
              <Feather name="plus" size={14} color="#A3A3A3" />
              <Text className="text-[13px] font-medium text-neutral-400">Custom</Text>
            </Pressable>
          )}
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* Continue */}
      <View className="px-6 pb-10 pt-4 bg-neutral-50">
        <Pressable
          onPress={onNext}
          className={`py-4 rounded-2xl items-center ${totalSelected > 0 ? 'bg-black' : 'bg-neutral-300'}`}
          disabled={totalSelected === 0}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">
            Continue ({totalSelected} selected)
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
