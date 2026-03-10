import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';
import { DEFAULT_EXPENSE_CATEGORIES, PARENT_CATEGORIES, PARENT_CATEGORY_COLORS } from '@/lib/constants/categories';
import type { FeatherIcon } from '@/lib/models/types';

interface ChooseCategoriesProps {
  onNext: () => void;
  onBack: () => void;
}

export function ChooseCategories({ onNext, onBack }: ChooseCategoriesProps) {
  const customCategories = useOnboardingStore((s) => s.customCategories);
  const setCustomCategories = useOnboardingStore((s) => s.setCustomCategories);

  const [showForm, setShowForm] = useState(false);
  const [inputName, setInputName] = useState('');
  const [selectedParent, setSelectedParent] = useState<string | null>(null);

  const resetForm = () => {
    setInputName('');
    setSelectedParent(null);
    setShowForm(false);
  };

  const addCustom = () => {
    const trimmed = inputName.trim();
    if (!trimmed || customCategories.some((c) => c.name === trimmed)) return;
    setCustomCategories([
      ...customCategories,
      { name: trimmed, parentCategory: selectedParent ?? undefined },
    ]);
    resetForm();
  };

  const removeCustom = (name: string) => {
    setCustomCategories(customCategories.filter((c) => c.name !== name));
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center mb-4">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[28px] font-bold text-black">We've got you covered</Text>
          <Text className="text-neutral-400 text-[15px] mt-2">
            40 categories are already set up for you. Add more if you need something specific.
          </Text>
        </View>

        {/* Grouped default categories */}
        <View className="px-6 gap-5">
          {PARENT_CATEGORIES.map((parent) => {
            const cats = DEFAULT_EXPENSE_CATEGORIES.filter((c) => c.parentCategory === parent);
            const color = PARENT_CATEGORY_COLORS[parent];
            return (
              <View key={parent}>
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <Text className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">{parent}</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {cats.map((cat) => (
                    <View
                      key={cat.name}
                      className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-white"
                    >
                      <Feather name={cat.icon as FeatherIcon} size={12} color={color} />
                      <Text className="text-[12px] font-medium text-black">{cat.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* Custom categories */}
        <View className="px-6 mt-6">
          <Text className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Your custom categories
          </Text>

          {/* Added chips */}
          {customCategories.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {customCategories.map((cat) => {
                const color = cat.parentCategory
                  ? PARENT_CATEGORY_COLORS[cat.parentCategory]
                  : undefined;
                return (
                  <View key={cat.name} className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-black">
                    {color && <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />}
                    <Text className="text-[12px] font-medium text-white">{cat.name}</Text>
                    <Pressable onPress={() => removeCustom(cat.name)}>
                      <Feather name="x" size={12} color="#fff" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Add form */}
          {showForm ? (
            <View className="bg-white rounded-2xl p-4 gap-3">
              {/* Name input */}
              <TextInput
                value={inputName}
                onChangeText={setInputName}
                placeholder="Category name"
                placeholderTextColor="#A3A3A3"
                className="text-[14px] text-black border-b border-neutral-100 pb-2"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={addCustom}
              />

              {/* Group picker */}
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Group
                  </Text>
                  <View className="bg-neutral-100 rounded-full px-2 py-0.5">
                    <Text className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wide">
                      Optional
                    </Text>
                  </View>
                </View>

                {/* Why it matters */}
                <View className="flex-row items-start gap-2 bg-blue-50 rounded-xl px-3 py-2">
                  <Feather name="pie-chart" size={11} color="#3B82F6" style={{ marginTop: 1 }} />
                  <Text className="flex-1 text-[11px] text-blue-500 leading-4">
                    Grouping rolls this into an existing pie slice.{' '}
                    <Text className="font-semibold">Skip it</Text> and it becomes its own group.
                  </Text>
                </View>

                <View className="flex-row flex-wrap gap-1.5">
                  {PARENT_CATEGORIES.map((parent) => {
                    const color = PARENT_CATEGORY_COLORS[parent];
                    const selected = selectedParent === parent;
                    return (
                      <Pressable
                        key={parent}
                        onPress={() => setSelectedParent(selected ? null : parent)}
                        className={`flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg ${selected ? 'bg-black' : 'bg-neutral-100'}`}
                      >
                        <View
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: selected ? '#fff' : color }}
                        />
                        <Text className={`text-[11px] font-medium ${selected ? 'text-white' : 'text-neutral-600'}`}>
                          {parent}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Actions */}
              <View className="flex-row gap-2 pt-1">
                <Pressable
                  onPress={addCustom}
                  disabled={!inputName.trim()}
                  className={`flex-1 py-2.5 rounded-xl items-center ${inputName.trim() ? 'bg-black' : 'bg-neutral-200'}`}
                >
                  <Text className={`text-[13px] font-semibold ${inputName.trim() ? 'text-white' : 'text-neutral-400'}`}>
                    Add
                  </Text>
                </Pressable>
                <Pressable onPress={resetForm} className="flex-1 py-2.5 rounded-xl items-center bg-neutral-100">
                  <Text className="text-[13px] font-medium text-neutral-500">Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowForm(true)}
              className="flex-row items-center gap-2 px-3 py-2 rounded-xl bg-white border border-dashed border-neutral-300 self-start"
            >
              <Feather name="plus" size={13} color="#A3A3A3" />
              <Text className="text-[12px] font-medium text-neutral-400">Add category</Text>
            </Pressable>
          )}
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* Continue */}
      <View className="px-6 pb-10 pt-4 bg-neutral-50">
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl items-center bg-black"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
