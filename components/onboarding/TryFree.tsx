import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface TryFreeProps {
  onNext: () => void;
}

export function TryFree({ onNext }: TryFreeProps) {
  return (
    <View className="flex-1 justify-between px-6">
      {/* Content */}
      <View className="items-center mt-16">
        <View className="w-20 h-20 rounded-3xl bg-black items-center justify-center mb-8">
          <Feather name="gift" size={36} color="#fff" />
        </View>

        <Text className="text-[28px] font-bold text-black text-center">
          Try Pennify Free
        </Text>

        <Text className="text-neutral-400 text-[15px] mt-3 text-center leading-6">
          Enjoy full access for 7 days.{'\n'}No credit card required.
        </Text>

        <View className="mt-10 gap-5 w-full">
          <View className="flex-row items-center gap-4">
            <View className="w-11 h-11 rounded-xl bg-neutral-100 items-center justify-center">
              <Feather name="zap" size={20} color="#000" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-black">Unlimited Tracking</Text>
              <Text className="text-[13px] text-neutral-400 mt-0.5">Track all your accounts & transactions</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="w-11 h-11 rounded-xl bg-neutral-100 items-center justify-center">
              <Feather name="bar-chart-2" size={20} color="#000" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-black">Detailed Reports</Text>
              <Text className="text-[13px] text-neutral-400 mt-0.5">Get insights into your spending habits</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="w-11 h-11 rounded-xl bg-neutral-100 items-center justify-center">
              <Feather name="refresh-cw" size={20} color="#000" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-black">Cloud Sync</Text>
              <Text className="text-[13px] text-neutral-400 mt-0.5">Access your data on any device</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="w-11 h-11 rounded-xl bg-neutral-100 items-center justify-center">
              <Feather name="target" size={20} color="#000" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-black">Smart Budgets & Goals</Text>
              <Text className="text-[13px] text-neutral-400 mt-0.5">AI-powered budget recommendations</Text>
            </View>
          </View>
        </View>
      </View>

      {/* CTA */}
      <View className="pb-10 gap-3">
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl items-center bg-black"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">Start Free Trial</Text>
        </Pressable>

        <Pressable onPress={onNext}>
          <Text className="text-neutral-500 text-[14px] text-center">
            View plans
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
