import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBudgetStore } from '@/lib/stores/useBudgetStore';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const currency = useSettingsStore((s) => s.currency);
  const budgets = useBudgetStore((s) => s.budgets);
  const goals = useGoalStore((s) => s.goals);

  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalLimit = budgets.reduce((s, b) => s + b.limit_amount, 0);

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-[22px] font-bold text-black tracking-tight">
          Plan
        </Text>
        <Pressable
          onPress={() => router.push('/add-budget')}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
        >
          <Feather name="plus" size={18} color="#000" />
        </Pressable>
      </View>

      {/* Budget Overview Card */}
      <View className="mx-6 mt-4 bg-black rounded-2xl p-6">
        <Text className="text-neutral-500 text-[13px]">Monthly Budget</Text>
        <View className="flex-row items-end mt-1 gap-1">
          <Text className="text-white text-[32px] font-bold tracking-tight leading-tight">
            {formatCurrency(totalSpent, currency)}
          </Text>
          <Text className="text-neutral-500 text-[16px] mb-1">
            / {formatCurrency(totalLimit, currency)}
          </Text>
        </View>
        <View className="h-2 bg-white/10 rounded-full mt-4">
          <View
            className="h-2 bg-white rounded-full"
            style={{ width: `${totalLimit > 0 ? Math.min(Math.round((totalSpent / totalLimit) * 100), 100) : 0}%` }}
          />
        </View>
        <Text className="text-neutral-500 text-[12px] mt-2">
          {formatCurrency(Math.max(totalLimit - totalSpent, 0), currency)} remaining this month
        </Text>
      </View>

      {/* Budget Categories */}
      <View className="px-6 mt-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[17px] font-bold text-black">Budgets</Text>
          <Pressable>
            <Text className="text-[12px] text-neutral-400">Edit</Text>
          </Pressable>
        </View>

        {budgets.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Feather name="clipboard" size={32} color="#D4D4D4" />
            <Text className="text-neutral-400 text-[14px] mt-3">No budgets set</Text>
            <Text className="text-neutral-300 text-[12px] mt-1">Tap + to create one</Text>
          </View>
        ) : (
          budgets.map((b) => {
            const pct = b.limit_amount > 0 ? Math.round((b.spent / b.limit_amount) * 100) : 0;
            const isOver = pct > 90;

            return (
              <View key={b.id} className="bg-white rounded-2xl p-4 mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-neutral-100 items-center justify-center">
                      <Feather name={b.category_icon} size={17} color="#000" />
                    </View>
                    <View>
                      <Text className="text-[14px] font-semibold text-black">
                        {b.category_name}
                      </Text>
                      <Text className="text-[11px] text-neutral-400 mt-0.5">
                        {formatCurrency(b.spent, currency)} of {formatCurrency(b.limit_amount, currency)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className={`text-[14px] font-bold ${
                      isOver ? 'text-red-500' : 'text-black'
                    }`}
                  >
                    {pct}%
                  </Text>
                </View>
                <View className="h-1.5 bg-neutral-100 rounded-full mt-3">
                  <View
                    className={`h-1.5 rounded-full ${
                      isOver ? 'bg-red-500' : 'bg-black'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Savings Goals */}
      <View className="px-6 mt-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[17px] font-bold text-black">Savings Goals</Text>
          <Pressable
            onPress={() => router.push('/add-goal')}
            className="flex-row items-center gap-1"
          >
            <Feather name="plus" size={14} color="#A3A3A3" />
            <Text className="text-[12px] text-neutral-400">Add Goal</Text>
          </Pressable>
        </View>

        {goals.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Feather name="target" size={32} color="#D4D4D4" />
            <Text className="text-neutral-400 text-[14px] mt-3">No goals yet</Text>
            <Text className="text-neutral-300 text-[12px] mt-1">Tap Add Goal to start saving</Text>
          </View>
        ) : (
          goals.map((g) => {
            const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;

            return (
              <View key={g.id} className="bg-white rounded-2xl p-5 mb-3">
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-11 h-11 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: g.color + '15' }}
                  >
                    <Feather name={g.icon} size={18} color={g.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold text-black">
                      {g.name}
                    </Text>
                    <Text className="text-[11px] text-neutral-400 mt-0.5">
                      {pct}% complete
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[15px] font-bold text-black">
                      {formatCurrencyCompact(g.saved, currency)}
                    </Text>
                    <Text className="text-[11px] text-neutral-400">
                      of {formatCurrencyCompact(g.target, currency)}
                    </Text>
                  </View>
                </View>
                <View className="h-1.5 bg-neutral-100 rounded-full mt-4">
                  <View
                    className="h-1.5 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: g.color }}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Tip Card */}
      <View className="mx-6 mt-4 bg-white rounded-2xl p-5 flex-row items-center gap-4">
        <View className="w-10 h-10 rounded-xl bg-neutral-100 items-center justify-center">
          <Feather name="target" size={18} color="#000" />
        </View>
        <View className="flex-1">
          <Text className="text-[13px] font-semibold text-black">
            Budget Tip
          </Text>
          <Text className="text-[12px] text-neutral-400 mt-0.5 leading-4">
            Set budgets for each spending category to stay on track with your financial goals.
          </Text>
        </View>
      </View>

      <View className="h-32" />
    </ScrollView>
  );
}
