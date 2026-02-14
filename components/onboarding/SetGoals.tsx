import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore, type OnboardingGoal } from '@/lib/stores/useOnboardingStore';
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

interface SetGoalsProps {
  onNext: () => void;
  onBack: () => void;
}

export function SetGoals({ onNext, onBack }: SetGoalsProps) {
  const goals = useOnboardingStore((s) => s.goals);
  const setGoals = useOnboardingStore((s) => s.setGoals);
  const currency = useOnboardingStore((s) => s.currency);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newIcon, setNewIcon] = useState<FeatherIcon>('target');
  const [newColor, setNewColor] = useState('#000000');

  const addGoal = () => {
    if (!newName.trim() || !newTarget.trim()) return;
    setGoals([
      ...goals,
      { name: newName.trim(), icon: newIcon, target: newTarget.trim(), color: newColor },
    ]);
    setNewName('');
    setNewTarget('');
    setNewIcon('target');
    setNewColor('#000000');
    setShowAdd(false);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center mb-4">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[28px] font-bold text-black">
            Savings goals
          </Text>
          <Text className="text-neutral-400 text-[15px] mt-2">
            What are you saving for? Add your goals.
          </Text>
        </View>

        {/* Goals list */}
        <View className="mx-6 gap-3">
          {goals.map((g, i) => (
            <View key={i} className="bg-white rounded-2xl p-4 flex-row items-center">
              <View
                className="w-11 h-11 rounded-xl items-center justify-center"
                style={{ backgroundColor: g.color + '20' }}
              >
                <Feather name={g.icon} size={18} color={g.color} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-[15px] font-semibold text-black">{g.name}</Text>
                <Text className="text-[12px] text-neutral-400 mt-0.5">
                  Target: {getCurrencySymbol(currency)}{g.target}
                </Text>
              </View>
              <Pressable onPress={() => removeGoal(i)} className="p-2">
                <Feather name="x" size={16} color="#A3A3A3" />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Add goal */}
        {showAdd ? (
          <View className="mx-6 mt-3 bg-white rounded-2xl p-5">
            <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Goal Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Vacation, New Laptop..."
              placeholderTextColor="#D4D4D4"
              className="text-[16px] text-black mb-4"
              autoFocus
            />

            <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Target</Text>
            <View className="flex-row items-center mb-4">
              <Text className="text-[20px] font-bold text-black mr-1">{getCurrencySymbol(currency)}</Text>
              <TextInput
                value={newTarget}
                onChangeText={setNewTarget}
                placeholder="0"
                placeholderTextColor="#D4D4D4"
                keyboardType="decimal-pad"
                className="flex-1 text-[20px] font-bold text-black"
              />
            </View>

            <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Icon</Text>
            <View className="flex-row flex-wrap gap-3 mb-4">
              {GOAL_ICONS.map((item) => (
                <Pressable
                  key={item.icon}
                  onPress={() => setNewIcon(item.icon)}
                  className={`w-12 h-12 rounded-xl items-center justify-center ${
                    newIcon === item.icon ? 'bg-black' : 'bg-neutral-100'
                  }`}
                >
                  <Feather name={item.icon} size={20} color={newIcon === item.icon ? '#fff' : '#000'} />
                </Pressable>
              ))}
            </View>

            <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Color</Text>
            <View className="flex-row gap-3 mb-4">
              {GOAL_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setNewColor(color)}
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    newColor === color ? 'border-2 border-neutral-300' : ''
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {newColor === color && <Feather name="check" size={16} color="#fff" />}
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => { setShowAdd(false); setNewName(''); setNewTarget(''); }}
                className="flex-1 py-3 rounded-xl items-center bg-neutral-100"
              >
                <Text className="text-[14px] font-semibold text-neutral-500">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={addGoal}
                className={`flex-1 py-3 rounded-xl items-center ${
                  newName.trim() && newTarget.trim() ? 'bg-black' : 'bg-neutral-300'
                }`}
                disabled={!newName.trim() || !newTarget.trim()}
              >
                <Text className="text-[14px] font-semibold text-white">Add</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowAdd(true)}
            className="mx-6 mt-3 bg-white rounded-2xl p-4 flex-row items-center justify-center gap-2"
          >
            <Feather name="plus" size={18} color="#A3A3A3" />
            <Text className="text-[14px] font-medium text-neutral-400">Add Goal</Text>
          </Pressable>
        )}

        <View className="h-32" />
      </ScrollView>

      {/* Continue */}
      <View className="px-6 pb-10 pt-4 bg-neutral-50">
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl items-center bg-black"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">
            {goals.length > 0 ? `Continue (${goals.length} goals)` : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
