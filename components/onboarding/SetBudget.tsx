import { useRef, useCallback } from 'react';
import { Pressable, Text, View, FlatList, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 60;
const SIDE_PADDING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

// Generate budget values from 0 to 50,000 in steps of 500
const BUDGET_VALUES = Array.from({ length: 101 }, (_, i) => i * 500);

interface SetBudgetProps {
  onNext: () => void;
  onBack: () => void;
}

export function SetBudget({ onNext, onBack }: SetBudgetProps) {
  const monthlyBudget = useOnboardingStore((s) => s.monthlyBudget);
  const setMonthlyBudget = useOnboardingStore((s) => s.setMonthlyBudget);
  const currency = useOnboardingStore((s) => s.currency);
  const flatListRef = useRef<FlatList>(null);

  const initialIndex = BUDGET_VALUES.indexOf(monthlyBudget);

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
      const clamped = Math.max(0, Math.min(index, BUDGET_VALUES.length - 1));
      setMonthlyBudget(BUDGET_VALUES[clamped]);
    },
    [setMonthlyBudget]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const isSelected = item === monthlyBudget;
      const isMajor = item % 5000 === 0;

      return (
        <View style={{ width: ITEM_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
          <View
            className={`rounded-full ${isSelected ? 'bg-black' : isMajor ? 'bg-neutral-300' : 'bg-neutral-200'}`}
            style={{
              width: isSelected ? 4 : isMajor ? 3 : 2,
              height: isSelected ? 40 : isMajor ? 28 : 18,
            }}
          />
          {isMajor && (
            <Text
              className={`text-[10px] mt-1 ${
                isSelected ? 'text-black font-bold' : 'text-neutral-400'
              }`}
            >
              {item >= 1000 ? `${item / 1000}k` : item}
            </Text>
          )}
        </View>
      );
    },
    [monthlyBudget]
  );

  return (
    <View className="flex-1 justify-between">
      <View>
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center mb-4">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[28px] font-bold text-black">
            Set a monthly budget
          </Text>
          <Text className="text-neutral-400 text-[15px] mt-2">
            How much do you plan to spend each month?
          </Text>
        </View>

        {/* Amount display */}
        <View className="items-center mt-8 mb-6">
          <Text className="text-[48px] font-bold text-black tracking-tight">
            {getCurrencySymbol(currency)}{monthlyBudget.toLocaleString()}
          </Text>
          <Text className="text-neutral-400 text-[14px] mt-1">per month</Text>
        </View>

        {/* Horizontal scroll picker */}
        <View className="h-20 items-center justify-center">
          {/* Center indicator */}
          <View
            className="absolute bg-black/5 rounded-xl"
            style={{ width: ITEM_WIDTH, height: 60, zIndex: 1 }}
            pointerEvents="none"
          />
          <FlatList
            ref={flatListRef}
            data={BUDGET_VALUES}
            renderItem={renderItem}
            keyExtractor={(item) => String(item)}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: SIDE_PADDING,
            }}
            initialScrollIndex={initialIndex >= 0 ? initialIndex : 10}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={onMomentumScrollEnd}
          />
        </View>

        {/* Quick select pills */}
        <View className="flex-row justify-center gap-2 mt-6 px-6 flex-wrap">
          {[1000, 2500, 5000, 10000, 20000, 50000].map((val) => (
            <Pressable
              key={val}
              onPress={() => {
                setMonthlyBudget(val);
                const index = BUDGET_VALUES.indexOf(val);
                if (index >= 0) {
                  flatListRef.current?.scrollToIndex({ index, animated: true });
                }
              }}
              className={`px-4 py-2.5 rounded-xl ${
                monthlyBudget === val ? 'bg-black' : 'bg-white'
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  monthlyBudget === val ? 'text-white' : 'text-black'
                }`}
              >
                {getCurrencySymbol(currency)}{val >= 1000 ? `${val / 1000}k` : val}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Continue */}
      <View className="px-6 pb-10 pt-4">
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
