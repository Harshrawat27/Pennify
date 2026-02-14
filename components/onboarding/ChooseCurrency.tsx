import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';
import { CURRENCIES } from '@/lib/utils/currency';

const currencyList = Object.values(CURRENCIES);

interface ChooseCurrencyProps {
  onNext: () => void;
  onBack: () => void;
}

export function ChooseCurrency({ onNext, onBack }: ChooseCurrencyProps) {
  const currency = useOnboardingStore((s) => s.currency);
  const setCurrency = useOnboardingStore((s) => s.setCurrency);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? currencyList.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : currencyList;

  const handleSelect = (code: string) => {
    setCurrency(code);
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center mb-4">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[28px] font-bold text-black">
            Choose your currency
          </Text>
          <Text className="text-neutral-400 text-[15px] mt-2">
            This will be used across the app for all amounts.
          </Text>
        </View>

        {/* Search */}
        <View className="mx-6 mb-4">
          <View className="bg-white rounded-xl px-4 py-3 flex-row items-center gap-2">
            <Feather name="search" size={16} color="#A3A3A3" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search currency..."
              placeholderTextColor="#A3A3A3"
              className="flex-1 text-[15px] text-black"
            />
          </View>
        </View>

        {/* Currency List */}
        <View className="mx-6 bg-white rounded-2xl px-4">
          {filtered.map((c, i) => {
            const isSelected = c.code === currency;
            const isLast = i === filtered.length - 1;

            return (
              <Pressable
                key={c.code}
                onPress={() => handleSelect(c.code)}
                className={`flex-row items-center py-4 ${
                  !isLast ? 'border-b border-neutral-100' : ''
                }`}
              >
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center ${
                    isSelected ? 'bg-black' : 'bg-neutral-100'
                  }`}
                >
                  <Text
                    className={`text-[16px] font-bold ${
                      isSelected ? 'text-white' : 'text-black'
                    }`}
                  >
                    {c.symbol}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-[14px] font-medium text-black">
                    {c.name}
                  </Text>
                  <Text className="text-[12px] text-neutral-400 mt-0.5">
                    {c.code}
                  </Text>
                </View>
                {isSelected && <Feather name="check" size={18} color="#000" />}
              </Pressable>
            );
          })}
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* Continue */}
      <View className="px-6 pb-10 pt-4 bg-neutral-50">
        <Pressable
          onPress={onNext}
          className={`py-4 rounded-2xl items-center ${currency ? 'bg-black' : 'bg-neutral-300'}`}
          disabled={!currency}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
