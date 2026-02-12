import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import type { FeatherIcon } from '@/lib/models/types';

const GOAL_ICONS: { icon: FeatherIcon; label: string }[] = [
  { icon: 'shield', label: 'Emergency' },
  { icon: 'monitor', label: 'Tech' },
  { icon: 'map', label: 'Travel' },
  { icon: 'home', label: 'Home' },
  { icon: 'heart', label: 'Health' },
  { icon: 'book', label: 'Education' },
  { icon: 'gift', label: 'Gift' },
  { icon: 'target', label: 'Other' },
];

const GOAL_COLORS = ['#000000', '#525252', '#A3A3A3', '#059669', '#2563EB', '#DC2626'];

export default function AddGoalScreen() {
  const insets = useSafeAreaInsets();
  const addGoal = useGoalStore((s) => s.addGoal);
  const currency = useSettingsStore((s) => s.currency);

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<FeatherIcon>('target');
  const [selectedColor, setSelectedColor] = useState('#000000');

  const handleSave = () => {
    const numTarget = parseFloat(target);
    if (!name.trim() || isNaN(numTarget) || numTarget <= 0) return;

    addGoal({
      name: name.trim(),
      icon: selectedIcon,
      target: numTarget,
      color: selectedColor,
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
          <Text className="text-[18px] font-bold text-black">Add Goal</Text>
          <View className="w-10" />
        </View>

        {/* Goal Name */}
        <View className="mx-6 mt-6 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Goal Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Vacation, New Laptop..."
            placeholderTextColor="#D4D4D4"
            className="text-[16px] text-black"
          />
        </View>

        {/* Target Amount */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Target Amount</Text>
          <View className="flex-row items-center">
            <Text className="text-[32px] font-bold text-black mr-1">{getCurrencySymbol(currency)}</Text>
            <TextInput
              value={target}
              onChangeText={setTarget}
              placeholder="0"
              placeholderTextColor="#D4D4D4"
              keyboardType="decimal-pad"
              className="flex-1 text-[32px] font-bold text-black"
            />
          </View>
        </View>

        {/* Icon Picker */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Icon</Text>
          <View className="flex-row flex-wrap gap-3">
            {GOAL_ICONS.map((item) => (
              <Pressable
                key={item.icon}
                onPress={() => setSelectedIcon(item.icon)}
                className={`w-12 h-12 rounded-xl items-center justify-center ${
                  selectedIcon === item.icon ? 'bg-black' : 'bg-neutral-100'
                }`}
              >
                <Feather
                  name={item.icon}
                  size={20}
                  color={selectedIcon === item.icon ? '#fff' : '#000'}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Color Picker */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Color</Text>
          <View className="flex-row gap-3">
            {GOAL_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  selectedColor === color ? 'border-2 border-neutral-300' : ''
                }`}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && (
                  <Feather name="check" size={16} color="#fff" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <View className="mx-6 mt-6">
          <Pressable
            onPress={handleSave}
            className={`py-4 rounded-2xl items-center ${
              name.trim() && target ? 'bg-black' : 'bg-neutral-300'
            }`}
          >
            <Text className="text-white font-bold text-[16px]">Save Goal</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
