import { useRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';

interface SetBudgetProps {
  onNext: () => void;
  onBack: () => void;
}

export function SetBudget({ onNext, onBack }: SetBudgetProps) {
  const monthlyBudget = useOnboardingStore((s) => s.monthlyBudget);
  const setMonthlyBudget = useOnboardingStore((s) => s.setMonthlyBudget);
  const currency = useOnboardingStore((s) => s.currency);
  const inputRef = useRef<TextInput>(null);

  const displayValue = monthlyBudget > 0 ? String(monthlyBudget) : '';

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setMonthlyBudget(cleaned ? Number(cleaned) : 0);
  };

  const handleQuickPick = (val: number) => {
    setMonthlyBudget(val);
    Keyboard.dismiss();
  };

  const formatPill = (val: number) => {
    const sym = getCurrencySymbol(currency);
    if (val >= 1000000) return `${sym}${val / 1000000}M`;
    if (val >= 1000) return `${sym}${val / 1000}k`;
    return `${sym}${val}`;
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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

            {/* Amount input */}
            <Pressable
              className="mx-6 mt-6 bg-white rounded-2xl p-6"
              onPress={() => inputRef.current?.focus()}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-[48px] font-bold text-black mr-1">
                  {getCurrencySymbol(currency)}
                </Text>
                <TextInput
                  ref={inputRef}
                  value={displayValue}
                  onChangeText={handleChange}
                  placeholder="0"
                  placeholderTextColor="#D4D4D4"
                  keyboardType="number-pad"
                  className="text-[48px] font-bold text-black min-w-[40px]"
                />
              </View>
              <Text className="text-neutral-400 text-[14px] text-center mt-2">per month</Text>
            </Pressable>

            {/* Quick select pills */}
            <View className="flex-row justify-center gap-2 mt-6 px-6">
              {[5000, 10000, 50000, 100000, 500000].map((val) => (
                <Pressable
                  key={val}
                  onPress={() => handleQuickPick(val)}
                  className={`px-4 py-2.5 rounded-xl ${
                    monthlyBudget === val ? 'bg-black' : 'bg-white'
                  }`}
                >
                  <Text
                    className={`text-[13px] font-medium ${
                      monthlyBudget === val ? 'text-white' : 'text-black'
                    }`}
                  >
                    {formatPill(val)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Continue */}
          <View className="px-6 pb-10 pt-4">
            <Pressable
              onPress={onNext}
              className={`py-4 rounded-2xl items-center ${monthlyBudget > 0 ? 'bg-black' : 'bg-neutral-300'}`}
              disabled={monthlyBudget <= 0}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-white font-bold text-[16px]">Continue</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
