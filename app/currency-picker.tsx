import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { CURRENCIES } from '@/lib/utils/currency';

const currencyList = Object.values(CURRENCIES);

export default function CurrencyPickerScreen() {
  const insets = useSafeAreaInsets();
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);

  const handleSelect = (code: string) => {
    setCurrency(code);
    router.back();
  };

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
        >
          <Feather name="x" size={20} color="#000" />
        </Pressable>
        <Text className="text-[18px] font-bold text-black">Currency</Text>
        <View className="w-10" />
      </View>

      {/* Currency List */}
      <View className="mx-6 mt-5 bg-white rounded-2xl px-4">
        {currencyList.map((c, i) => {
          const isSelected = c.code === currency;
          const isLast = i === currencyList.length - 1;

          return (
            <Pressable
              key={c.code}
              onPress={() => handleSelect(c.code)}
              className={`flex-row items-center py-4 ${
                !isLast ? 'border-b border-neutral-100' : ''
              }`}
            >
              <View className="w-10 h-10 rounded-xl bg-neutral-100 items-center justify-center">
                <Text className="text-[16px] font-bold text-black">
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
              {isSelected && (
                <Feather name="check" size={18} color="#000" />
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
