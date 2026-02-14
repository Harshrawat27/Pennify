import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';

interface TrackIncomeProps {
  onNext: () => void;
  onBack: () => void;
}

export function TrackIncome({ onNext, onBack }: TrackIncomeProps) {
  const trackIncome = useOnboardingStore((s) => s.trackIncome);
  const setTrackIncome = useOnboardingStore((s) => s.setTrackIncome);

  const handleSelect = (value: boolean) => {
    setTrackIncome(value);
  };

  return (
    <View className="flex-1 justify-between">
      <View>
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center mb-4">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[28px] font-bold text-black">
            Track your income too?
          </Text>
          <Text className="text-neutral-400 text-[15px] mt-2">
            Do you want to track both income and expenses, or just expenses?
          </Text>
        </View>

        {/* Options */}
        <View className="mx-6 mt-6 gap-3">
          <Pressable
            onPress={() => handleSelect(true)}
            className={`bg-white rounded-2xl p-5 flex-row items-center border-2 ${
              trackIncome ? 'border-black' : 'border-transparent'
            }`}
          >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
              trackIncome ? 'bg-black' : 'bg-neutral-100'
            }`}>
              <Feather name="trending-up" size={22} color={trackIncome ? '#fff' : '#000'} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-[16px] font-semibold text-black">
                Yes, track income & expenses
              </Text>
              <Text className="text-[13px] text-neutral-400 mt-1">
                See the full picture of your money flow
              </Text>
            </View>
            {trackIncome && <Feather name="check-circle" size={22} color="#000" />}
          </Pressable>

          <Pressable
            onPress={() => handleSelect(false)}
            className={`bg-white rounded-2xl p-5 flex-row items-center border-2 ${
              !trackIncome ? 'border-black' : 'border-transparent'
            }`}
          >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
              !trackIncome ? 'bg-black' : 'bg-neutral-100'
            }`}>
              <Feather name="arrow-down-right" size={22} color={!trackIncome ? '#fff' : '#000'} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-[16px] font-semibold text-black">
                No, just expenses
              </Text>
              <Text className="text-[13px] text-neutral-400 mt-1">
                Focus only on tracking what you spend
              </Text>
            </View>
            {!trackIncome && <Feather name="check-circle" size={22} color="#000" />}
          </Pressable>
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
