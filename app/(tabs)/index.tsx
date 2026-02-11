import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

type Transaction = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  icon: React.ComponentProps<typeof Feather>['name'];
};

const TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'Groceries', category: 'Food', amount: -450, date: 'Today', icon: 'shopping-cart' },
  { id: '2', title: 'Coffee', category: 'Food', amount: -150, date: 'Today', icon: 'coffee' },
  { id: '3', title: 'Freelance Payment', category: 'Income', amount: 5000, date: 'Yesterday', icon: 'briefcase' },
  { id: '4', title: 'Uber Ride', category: 'Transport', amount: -250, date: 'Yesterday', icon: 'navigation' },
  { id: '5', title: 'Netflix', category: 'Entertainment', amount: -199, date: 'Feb 8', icon: 'play-circle' },
  { id: '6', title: 'Electricity Bill', category: 'Bills', amount: -1200, date: 'Feb 7', icon: 'zap' },
  { id: '7', title: 'Salary', category: 'Income', amount: 30000, date: 'Feb 1', icon: 'dollar-sign' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-black tracking-tight">Pennify</Text>
          <Text className="text-sm text-gray-400 mt-0.5">February 2026</Text>
        </View>
        <Pressable className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
          <Feather name="bell" size={18} color="#000" />
        </Pressable>
      </View>

      {/* Balance Card */}
      <View className="mx-6 mt-4 bg-black rounded-2xl p-6">
        <Text className="text-gray-400 text-sm">Total Balance</Text>
        <Text className="text-white text-4xl font-bold mt-1 tracking-tight">
          ₹24,500
        </Text>

        <View className="flex-row mt-5 gap-3">
          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <View className="flex-row items-center gap-1.5">
              <View className="w-5 h-5 rounded-full bg-emerald-500/20 items-center justify-center">
                <Feather name="arrow-up-right" size={12} color="#22C55E" />
              </View>
              <Text className="text-gray-400 text-xs">Income</Text>
            </View>
            <Text className="text-white font-bold text-lg mt-2">₹35,000</Text>
          </View>

          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <View className="flex-row items-center gap-1.5">
              <View className="w-5 h-5 rounded-full bg-red-500/20 items-center justify-center">
                <Feather name="arrow-down-right" size={12} color="#EF4444" />
              </View>
              <Text className="text-gray-400 text-xs">Expenses</Text>
            </View>
            <Text className="text-white font-bold text-lg mt-2">₹10,500</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex-row mx-6 mt-6 gap-3">
        <Pressable className="flex-1 flex-row items-center justify-center gap-2 border border-gray-200 rounded-xl py-3.5">
          <Feather name="minus" size={16} color="#000" />
          <Text className="text-black font-semibold text-sm">Expense</Text>
        </Pressable>
        <Pressable className="flex-1 flex-row items-center justify-center gap-2 bg-black rounded-xl py-3.5">
          <Feather name="plus" size={16} color="#fff" />
          <Text className="text-white font-semibold text-sm">Income</Text>
        </Pressable>
      </View>

      {/* Spending Overview */}
      <View className="mx-6 mt-8">
        <Text className="text-lg font-bold text-black">This Month</Text>
        <View className="flex-row mt-3 gap-3">
          <SpendCategory label="Food" amount={600} icon="shopping-bag" />
          <SpendCategory label="Transport" amount={250} icon="navigation" />
          <SpendCategory label="Bills" amount={1200} icon="zap" />
          <SpendCategory label="Fun" amount={199} icon="smile" />
        </View>
      </View>

      {/* Recent Transactions */}
      <View className="mt-8 px-6">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg font-bold text-black">Recent Transactions</Text>
          <Pressable>
            <Text className="text-sm text-gray-400">See all</Text>
          </Pressable>
        </View>

        {TRANSACTIONS.map((tx) => (
          <View
            key={tx.id}
            className="flex-row items-center py-3.5 border-b border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
              <Feather name={tx.icon} size={16} color="#000" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-black font-medium text-sm">{tx.title}</Text>
              <Text className="text-gray-400 text-xs mt-0.5">{tx.category}</Text>
            </View>
            <View className="items-end">
              <Text
                className={`font-semibold text-sm ${
                  tx.amount > 0 ? 'text-emerald-600' : 'text-black'
                }`}
              >
                {tx.amount > 0 ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
              </Text>
              <Text className="text-gray-400 text-xs mt-0.5">{tx.date}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}

function SpendCategory({
  label,
  amount,
  icon,
}: {
  label: string;
  amount: number;
  icon: React.ComponentProps<typeof Feather>['name'];
}) {
  return (
    <View className="flex-1 bg-gray-50 rounded-xl p-3 items-center">
      <View className="w-9 h-9 rounded-full bg-white items-center justify-center mb-2">
        <Feather name={icon} size={16} color="#000" />
      </View>
      <Text className="text-gray-500 text-[10px]">{label}</Text>
      <Text className="text-black font-semibold text-xs mt-0.5">₹{amount.toLocaleString()}</Text>
    </View>
  );
}
