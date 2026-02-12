import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const PERIOD_TABS = ['Week', 'Month', 'Year'];

type Category = {
  name: string;
  amount: number;
  icon: React.ComponentProps<typeof Feather>['name'];
  percent: number;
};

const CATEGORIES: Category[] = [
  { name: 'Food & Dining', amount: 3200, icon: 'shopping-bag', percent: 38 },
  { name: 'Transport', amount: 1800, icon: 'navigation', percent: 21 },
  { name: 'Bills & Utilities', amount: 1500, icon: 'zap', percent: 18 },
  { name: 'Entertainment', amount: 1000, icon: 'play-circle', percent: 12 },
  { name: 'Shopping', amount: 645, icon: 'shopping-cart', percent: 8 },
  { name: 'Other', amount: 300, icon: 'more-horizontal', percent: 3 },
];

const WEEKLY_DATA = [
  { day: 'Mon', amount: 450, maxH: 28 },
  { day: 'Tue', amount: 1200, maxH: 75 },
  { day: 'Wed', amount: 300, maxH: 19 },
  { day: 'Thu', amount: 800, maxH: 50 },
  { day: 'Fri', amount: 1600, maxH: 100 },
  { day: 'Sat', amount: 950, maxH: 59 },
  { day: 'Sun', amount: 200, maxH: 13 },
];

const RING_SIZE = 160;
const RING_STROKE = 14;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;
const SPENT_PERCENT = 62;

export default function ReportScreen() {
  const insets = useSafeAreaInsets();

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

      {/* Donut Ring — Spent vs Budget */}
      <View className="items-center mt-8">
        <View style={{ width: RING_SIZE, height: RING_SIZE }}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#F0F0F0"
              strokeWidth={RING_STROKE}
              fill="none"
            />
            {/* Spent ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#000000"
              strokeWidth={RING_STROKE}
              fill="none"
              strokeDasharray={`${RING_CIRC * (SPENT_PERCENT / 100)} ${RING_CIRC}`}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          {/* Center text */}
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-[28px] font-bold text-black">{SPENT_PERCENT}%</Text>
            <Text className="text-[11px] text-neutral-400">of budget</Text>
          </View>
        </View>
        <View className="flex-row gap-6 mt-5">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-black" />
            <Text className="text-[12px] text-neutral-500">Spent ₹8,445</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-neutral-200" />
            <Text className="text-[12px] text-neutral-500">Left ₹5,155</Text>
          </View>
        </View>
      </View>

      {/* Weekly Bar Chart */}
      <View className="mx-6 mt-8 bg-white rounded-2xl p-5">
        <Text className="text-[15px] font-bold text-black mb-5">
          Daily Spending
        </Text>
        <View className="flex-row items-end justify-between" style={{ height: 110 }}>
          {WEEKLY_DATA.map((d) => (
            <View key={d.day} className="items-center flex-1">
              <Text className="text-[10px] text-neutral-400 mb-2">
                ₹{d.amount >= 1000 ? `${(d.amount / 1000).toFixed(1)}k` : d.amount}
              </Text>
              <View
                className={`w-6 rounded-full ${
                  d.day === 'Fri' ? 'bg-black' : 'bg-neutral-200'
                }`}
                style={{ height: d.maxH }}
              />
              <Text className="text-[10px] text-neutral-400 mt-2">{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Income vs Expense */}
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
            <Text className="text-[20px] font-bold text-black">₹35,000</Text>
            <View className="h-1.5 bg-neutral-100 rounded-full mt-2">
              <View className="h-1.5 bg-emerald-500 rounded-full" style={{ width: '100%' }} />
            </View>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 mb-2">
              <View className="w-2.5 h-2.5 rounded-full bg-black" />
              <Text className="text-[12px] text-neutral-400">Expenses</Text>
            </View>
            <Text className="text-[20px] font-bold text-black">₹8,445</Text>
            <View className="h-1.5 bg-neutral-100 rounded-full mt-2">
              <View className="h-1.5 bg-black rounded-full" style={{ width: '24%' }} />
            </View>
          </View>
        </View>
      </View>

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

        {CATEGORIES.map((cat, i) => (
          <View key={cat.name} className={i > 0 ? 'mt-4' : ''}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-neutral-100 items-center justify-center">
                  <Feather name={cat.icon} size={16} color="#000" />
                </View>
                <Text className="text-[14px] font-medium text-black">
                  {cat.name}
                </Text>
              </View>
              <Text className="text-[14px] font-bold text-black">
                ₹{cat.amount.toLocaleString()}
              </Text>
            </View>
            <View className="h-1.5 bg-neutral-100 rounded-full">
              <View
                className="h-1.5 bg-black rounded-full"
                style={{ width: `${cat.percent}%` }}
              />
            </View>
          </View>
        ))}
      </View>

      <View className="h-32" />
    </ScrollView>
  );
}
