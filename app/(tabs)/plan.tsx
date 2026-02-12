import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

type Budget = {
  name: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  spent: number;
  limit: number;
};

type Goal = {
  name: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  saved: number;
  target: number;
  color: string;
};

const BUDGETS: Budget[] = [
  { name: 'Food & Dining', icon: 'shopping-bag', spent: 3200, limit: 5000 },
  { name: 'Transport', icon: 'navigation', spent: 1800, limit: 2000 },
  { name: 'Entertainment', icon: 'play-circle', spent: 1000, limit: 1500 },
  { name: 'Shopping', icon: 'shopping-cart', spent: 645, limit: 3000 },
  { name: 'Bills & Utilities', icon: 'zap', spent: 1500, limit: 2500 },
];

const GOALS: Goal[] = [
  { name: 'Emergency Fund', icon: 'shield', saved: 45000, target: 100000, color: '#000' },
  { name: 'New Laptop', icon: 'monitor', saved: 32000, target: 80000, color: '#525252' },
  { name: 'Vacation', icon: 'map', saved: 12000, target: 50000, color: '#A3A3A3' },
];

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const totalSpent = BUDGETS.reduce((s, b) => s + b.spent, 0);
  const totalLimit = BUDGETS.reduce((s, b) => s + b.limit, 0);

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
        <Pressable className="w-10 h-10 rounded-full bg-white items-center justify-center">
          <Feather name="plus" size={18} color="#000" />
        </Pressable>
      </View>

      {/* Budget Overview Card */}
      <View className="mx-6 mt-4 bg-black rounded-2xl p-6">
        <Text className="text-neutral-500 text-[13px]">Monthly Budget</Text>
        <View className="flex-row items-end mt-1 gap-1">
          <Text className="text-white text-[32px] font-bold tracking-tight leading-tight">
            ₹{totalSpent.toLocaleString()}
          </Text>
          <Text className="text-neutral-500 text-[16px] mb-1">
            / ₹{totalLimit.toLocaleString()}
          </Text>
        </View>
        <View className="h-2 bg-white/10 rounded-full mt-4">
          <View
            className="h-2 bg-white rounded-full"
            style={{ width: `${Math.round((totalSpent / totalLimit) * 100)}%` }}
          />
        </View>
        <Text className="text-neutral-500 text-[12px] mt-2">
          ₹{(totalLimit - totalSpent).toLocaleString()} remaining this month
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

        {BUDGETS.map((b) => {
          const pct = Math.round((b.spent / b.limit) * 100);
          const isOver = pct > 90;

          return (
            <View key={b.name} className="bg-white rounded-2xl p-4 mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-neutral-100 items-center justify-center">
                    <Feather name={b.icon} size={17} color="#000" />
                  </View>
                  <View>
                    <Text className="text-[14px] font-semibold text-black">
                      {b.name}
                    </Text>
                    <Text className="text-[11px] text-neutral-400 mt-0.5">
                      ₹{b.spent.toLocaleString()} of ₹{b.limit.toLocaleString()}
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
        })}
      </View>

      {/* Savings Goals */}
      <View className="px-6 mt-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[17px] font-bold text-black">Savings Goals</Text>
          <Pressable className="flex-row items-center gap-1">
            <Feather name="plus" size={14} color="#A3A3A3" />
            <Text className="text-[12px] text-neutral-400">Add Goal</Text>
          </Pressable>
        </View>

        {GOALS.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);

          return (
            <View key={g.name} className="bg-white rounded-2xl p-5 mb-3">
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
                    ₹{(g.saved / 1000).toFixed(0)}k
                  </Text>
                  <Text className="text-[11px] text-neutral-400">
                    of ₹{(g.target / 1000).toFixed(0)}k
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
        })}
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
            Your transport spending is 90% of the limit. Consider carpooling this week.
          </Text>
        </View>
      </View>

      <View className="h-32" />
    </ScrollView>
  );
}
