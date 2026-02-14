import { Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';

interface AddBalanceProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function AddBalance({ onNext, onBack, onSkip }: AddBalanceProps) {
  const overallBalance = useOnboardingStore((s) => s.overallBalance);
  const setOverallBalance = useOnboardingStore((s) => s.setOverallBalance);
  const currency = useOnboardingStore((s) => s.currency);

  return (
    <View className="flex-1 justify-between">
      <View>
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center mb-4">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[28px] font-bold text-black">
            What's your current balance?
          </Text>
          <Text className="text-neutral-400 text-[15px] mt-2">
            Your total balance across all accounts. This helps us track your net worth.
          </Text>
        </View>

        {/* Amount input */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-6">
          <View className="flex-row items-center justify-center">
            <Text className="text-[40px] font-bold text-black mr-1">
              {getCurrencySymbol(currency)}
            </Text>
            <TextInput
              value={overallBalance}
              onChangeText={setOverallBalance}
              placeholder="0"
              placeholderTextColor="#D4D4D4"
              keyboardType="decimal-pad"
              className="text-[40px] font-bold text-black min-w-[60px]"
              autoFocus
            />
          </View>
        </View>
      </View>

      {/* Bottom buttons */}
      <View className="px-6 pb-10 pt-4 gap-3">
        <Pressable
          onPress={onNext}
          className={`py-4 rounded-2xl items-center ${
            overallBalance.trim() ? 'bg-black' : 'bg-neutral-300'
          }`}
          disabled={!overallBalance.trim()}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">Continue</Text>
        </Pressable>

        <Pressable onPress={onSkip}>
          <Text className="text-neutral-500 text-[14px] text-center">
            Don't want to set now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
