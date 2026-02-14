import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Plan = 'free' | 'monthly' | 'yearly';

interface SubscriptionPlansProps {
  onFinish: () => void;
}

export function SubscriptionPlans({ onFinish }: SubscriptionPlansProps) {
  const [selected, setSelected] = useState<Plan>('yearly');

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-[28px] font-bold text-black text-center">
            Choose your plan
          </Text>
          <Text className="text-neutral-400 text-[15px] mt-2 text-center">
            Select the plan that works best for you.
          </Text>
        </View>

        {/* Plans */}
        <View className="mx-6 mt-4 gap-3">
          {/* Yearly */}
          <Pressable
            onPress={() => setSelected('yearly')}
            className={`bg-white rounded-2xl p-5 border-2 ${
              selected === 'yearly' ? 'border-black' : 'border-transparent'
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[18px] font-bold text-black">Pro Yearly</Text>
                  <View className="bg-black rounded-lg px-2.5 py-1">
                    <Text className="text-[10px] font-bold text-white">BEST VALUE</Text>
                  </View>
                </View>
                <Text className="text-neutral-400 text-[14px] mt-1">
                  $49.99/year
                </Text>
                <Text className="text-neutral-400 text-[12px] mt-0.5">
                  That's just $4.17/month
                </Text>
              </View>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selected === 'yearly' ? 'bg-black border-black' : 'border-neutral-300'
              }`}>
                {selected === 'yearly' && <Feather name="check" size={14} color="#fff" />}
              </View>
            </View>
          </Pressable>

          {/* Monthly */}
          <Pressable
            onPress={() => setSelected('monthly')}
            className={`bg-white rounded-2xl p-5 border-2 ${
              selected === 'monthly' ? 'border-black' : 'border-transparent'
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[18px] font-bold text-black">Pro Monthly</Text>
                <Text className="text-neutral-400 text-[14px] mt-1">
                  $5.99/month
                </Text>
              </View>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selected === 'monthly' ? 'bg-black border-black' : 'border-neutral-300'
              }`}>
                {selected === 'monthly' && <Feather name="check" size={14} color="#fff" />}
              </View>
            </View>
          </Pressable>

          {/* Free */}
          <Pressable
            onPress={() => setSelected('free')}
            className={`bg-white rounded-2xl p-5 border-2 ${
              selected === 'free' ? 'border-black' : 'border-transparent'
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[18px] font-bold text-black">Free</Text>
                <Text className="text-neutral-400 text-[14px] mt-1">
                  Basic tracking with limited features
                </Text>
              </View>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selected === 'free' ? 'bg-black border-black' : 'border-neutral-300'
              }`}>
                {selected === 'free' && <Feather name="check" size={14} color="#fff" />}
              </View>
            </View>
          </Pressable>
        </View>

        {/* Feature comparison */}
        <View className="mx-6 mt-8 bg-white rounded-2xl p-5">
          <Text className="text-[14px] font-bold text-black mb-4">What's included in Pro</Text>
          {[
            'Unlimited accounts & transactions',
            'Advanced reports & analytics',
            'Cloud sync across devices',
            'Custom categories & budgets',
            'Export data to CSV',
            'Priority support',
          ].map((feature) => (
            <View key={feature} className="flex-row items-center gap-3 mb-3">
              <Feather name="check" size={16} color="#000" />
              <Text className="text-[14px] text-black">{feature}</Text>
            </View>
          ))}
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* CTA */}
      <View className="px-6 pb-10 pt-4 bg-neutral-50">
        <Pressable
          onPress={onFinish}
          className="py-4 rounded-2xl items-center bg-black"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">
            {selected === 'free' ? 'Continue with Free' : 'Start Free Trial'}
          </Text>
        </Pressable>

        <Text className="text-neutral-400 text-[12px] text-center mt-3">
          {selected !== 'free'
            ? '7-day free trial · Cancel anytime'
            : 'You can upgrade anytime from settings'}
        </Text>
      </View>
    </View>
  );
}
