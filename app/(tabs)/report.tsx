import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/currency';

const PERIOD_TABS = ['Week', 'Month', 'Year'];

const RING_SIZE = 160;
const RING_STROKE = 14;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');
  const monthlyStats = useQuery(api.transactions.getMonthlyStats, userId ? { userId, month: currentMonth } : 'skip');
  const categoryBreakdown = useQuery(api.transactions.getCategoryBreakdown, userId ? { userId, month: currentMonth } : 'skip');
  const dailySpending = useQuery(api.transactions.getDailySpending, userId ? { userId, month: currentMonth } : 'skip');
  const monthlyBudget = useQuery(api.monthlyBudgets.getByMonth, userId ? { userId, month: currentMonth } : 'skip');

  const currency = prefs?.currency ?? 'INR';
  const trackIncome = prefs?.trackIncome ?? true;
  const income = monthlyStats?.income ?? 0;
  const expenses = monthlyStats?.expenses ?? 0;
  const budget = monthlyBudget?.budget ?? 0;

  const dailyData = (dailySpending ?? []).map((d) => ({
    day: DAY_NAMES[new Date(d.day + 'T00:00:00').getDay()],
    amount: d.amount,
  }));

  const maxDailyAmount = dailyData.reduce((max, d) => Math.max(max, d.amount), 0);
  const spentPercent = budget > 0 ? Math.round((expenses / budget) * 100) : 0;
  const leftAmount = Math.max(budget - expenses, 0);

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-[22px] font-bold text-black tracking-tight">
          Report
        </Text>
        <Pressable className="w-10 h-10 rounded-full bg-white items-center justify-center">
          <Feather name="download" size={18} color="#000" />
        </Pressable>
      </View>

      {/* Period Tabs */}
      <View className="flex-row mx-6 mt-3 bg-white rounded-xl p-1">
        {PERIOD_TABS.map((tab, i) => (
          <Pressable
            key={tab}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              i === 1 ? 'bg-black' : ''
            }`}
          >
            <Text
              className={`text-[13px] font-semibold ${
                i === 1 ? 'text-white' : 'text-neutral-400'
              }`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Donut Ring */}
      <View className="items-center mt-8">
        <View style={{ width: RING_SIZE, height: RING_SIZE }}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#F0F0F0"
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#000000"
              strokeWidth={RING_STROKE}
              fill="none"
              strokeDasharray={`${RING_CIRC * (Math.min(spentPercent, 100) / 100)} ${RING_CIRC}`}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-[28px] font-bold text-black">{spentPercent}%</Text>
            <Text className="text-[11px] text-neutral-400">of budget</Text>
          </View>
        </View>
        <View className="flex-row gap-6 mt-5">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-black" />
            <Text className="text-[12px] text-neutral-500">Spent {formatCurrency(expenses, currency)}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-neutral-200" />
            <Text className="text-[12px] text-neutral-500">Left {formatCurrency(leftAmount, currency)}</Text>
          </View>
        </View>
      </View>

      {/* Daily Spending Bar Chart */}
      {dailyData.length > 0 && (
        <View className="mx-6 mt-8 bg-white rounded-2xl p-5">
          <Text className="text-[15px] font-bold text-black mb-5">
            Daily Spending
          </Text>
          <View className="flex-row items-end justify-between" style={{ height: 110 }}>
            {dailyData.map((d, i) => {
              const barH = maxDailyAmount > 0 ? Math.max((d.amount / maxDailyAmount) * 100, 4) : 4;
              const isMax = d.amount === maxDailyAmount && maxDailyAmount > 0;
              return (
                <View key={`${d.day}-${i}`} className="items-center flex-1">
                  <Text className="text-[10px] text-neutral-400 mb-2">
                    {d.amount >= 1000 ? `${getCurrencySymbol(currency)}${(d.amount / 1000).toFixed(1)}k` : `${getCurrencySymbol(currency)}${d.amount}`}
                  </Text>
                  <View
                    className={`w-6 rounded-full ${isMax ? 'bg-black' : 'bg-neutral-200'}`}
                    style={{ height: barH }}
                  />
                  <Text className="text-[10px] text-neutral-400 mt-2">{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Income vs Expense */}
      {trackIncome ? (
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[15px] font-bold text-black mb-4">
            Income vs Expenses
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 mb-2">
                <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <Text className="text-[12px] text-neutral-400">Income</Text>
              </View>
              <Text className="text-[20px] font-bold text-black">{formatCurrency(income, currency)}</Text>
              <View className="h-1.5 bg-neutral-100 rounded-full mt-2">
                <View className="h-1.5 bg-emerald-500 rounded-full" style={{ width: '100%' }} />
              </View>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 mb-2">
                <View className="w-2.5 h-2.5 rounded-full bg-black" />
                <Text className="text-[12px] text-neutral-400">Expenses</Text>
              </View>
              <Text className="text-[20px] font-bold text-black">{formatCurrency(expenses, currency)}</Text>
              <View className="h-1.5 bg-neutral-100 rounded-full mt-2">
                <View
                  className="h-1.5 bg-black rounded-full"
                  style={{ width: `${budget > 0 ? Math.min(Math.round((expenses / budget) * 100), 100) : 0}%` }}
                />
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* Category Breakdown */}
      <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[15px] font-bold text-black">
            By Category
          </Text>
          <Pressable>
            <Text className="text-[12px] text-neutral-400">See all</Text>
          </Pressable>
        </View>

        {(categoryBreakdown ?? []).length === 0 ? (
          <View className="py-4 items-center">
            <Text className="text-neutral-400 text-[13px]">No spending data yet</Text>
          </View>
        ) : (
          (categoryBreakdown ?? []).map((cat, i) => (
            <View key={cat.name} className={i > 0 ? 'mt-4' : ''}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-neutral-100 items-center justify-center">
                    <Feather name={cat.icon as any} size={16} color="#000" />
                  </View>
                  <Text className="text-[14px] font-medium text-black">
                    {cat.name}
                  </Text>
                </View>
                <Text className="text-[14px] font-bold text-black">
                  {formatCurrency(cat.amount, currency)}
                </Text>
              </View>
              <View className="h-1.5 bg-neutral-100 rounded-full">
                <View
                  className="h-1.5 bg-black rounded-full"
                  style={{ width: `${cat.percent}%` }}
                />
              </View>
            </View>
          ))
        )}
      </View>

      <View className="h-32" />
    </ScrollView>
  );
}
