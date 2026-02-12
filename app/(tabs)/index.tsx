import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  balance?: number;
  icon: React.ComponentProps<typeof Feather>['name'];
  tags?: { label: string; icon: React.ComponentProps<typeof Feather>['name'] }[];
};

const TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    title: 'Cash, EUR',
    subtitle: 'Red Card',
    amount: -354.25,
    balance: 4245.21,
    icon: 'credit-card',
  },
  {
    id: '2',
    title: 'Cafes',
    subtitle: '',
    amount: -12.49,
    icon: 'coffee',
    tags: [
      { label: 'Vacation', icon: 'tag' },
      { label: 'Holdings', icon: 'users' },
    ],
  },
  {
    id: '3',
    title: 'Freelance Pay',
    subtitle: 'Bank Transfer',
    amount: 5000,
    balance: 29500,
    icon: 'briefcase',
  },
  {
    id: '4',
    title: 'Uber Ride',
    subtitle: 'Transport',
    amount: -250,
    icon: 'navigation',
    tags: [{ label: 'Commute', icon: 'map-pin' }],
  },
  {
    id: '5',
    title: 'Netflix',
    subtitle: 'Entertainment',
    amount: -199,
    icon: 'play-circle',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* ===== BLACK HERO AREA ===== */}
      <View style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-6 pt-4 flex-row justify-between items-center">
          <View className="w-12 h-12 rounded-full bg-white/15 items-center justify-center">
            <Feather name="user" size={20} color="#fff" />
          </View>

          <Pressable className="flex-row items-center bg-white/15 rounded-full px-5 py-2.5">
            <Text className="text-[13px] font-semibold text-white">
              February 2026
            </Text>
            <Feather
              name="chevron-down"
              size={14}
              color="#fff"
              style={{ marginLeft: 6 }}
            />
          </Pressable>

          <View className="relative">
            <Pressable className="w-12 h-12 rounded-full bg-white/15 items-center justify-center">
              <Feather name="bell" size={20} color="#fff" />
            </Pressable>
            <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-black" />
          </View>
        </View>

        {/* Balance */}
        <View className="items-center pt-10 pb-16">
          <Text className="text-neutral-500 text-[14px] tracking-widest uppercase">
            Current Balance
          </Text>
          <Text className="text-white text-[48px] font-bold mt-2 tracking-tight leading-none">
            ₹87,457
            <Text className="text-neutral-600 text-[34px]">.85</Text>
          </Text>
          <View className="mt-4 bg-white/10 rounded-full px-5 py-2">
            <Text className="text-neutral-400 text-[12px] tracking-wide">
              +₹784 than last week
            </Text>
          </View>
        </View>
      </View>

      {/* ===== WHITE CONTENT AREA (overlaps hero) ===== */}
      <View className="bg-neutral-50 rounded-t-[32px] -mt-4">
        {/* ── Your Money ── */}
        <View className="px-6 pt-7">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <Text className="text-[18px] font-bold text-black">
                Your Money
              </Text>
              <Feather name="info" size={15} color="#D4D4D4" />
            </View>
            <Pressable className="flex-row items-center gap-1">
              <Text className="text-[13px] text-neutral-400 font-medium">
                Details
              </Text>
              <Feather name="chevron-right" size={15} color="#A3A3A3" />
            </Pressable>
          </View>

          <View className="flex-row gap-3 mt-5">
            {/* Income Card */}
            <View className="flex-1 bg-white rounded-2xl p-5 pb-5">
              <View className="w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center">
                <Feather name="arrow-up-right" size={20} color="#000" />
              </View>
              <View className="mt-8">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Text className="text-neutral-400 text-[13px]">Income</Text>
                  <Feather name="info" size={11} color="#D4D4D4" />
                </View>
                <Text className="text-black text-[22px] font-bold tracking-tight">
                  ₹4,875.12
                </Text>
              </View>
            </View>

            {/* Expenses Card */}
            <View className="flex-1 bg-white rounded-2xl p-5 pb-5">
              <View className="w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center">
                <Feather name="arrow-down-right" size={20} color="#000" />
              </View>
              <View className="mt-8">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Text className="text-neutral-400 text-[13px]">Expenses</Text>
                  <Feather name="info" size={11} color="#D4D4D4" />
                </View>
                <Text className="text-black text-[22px] font-bold tracking-tight">
                  ₹8,145.78
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Insight Banner ── */}
        <View className="mx-6 mt-6">
          <View className="bg-black rounded-2xl px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <Text className="text-[14px]">✨</Text>
              <Text className="text-white font-semibold text-[13px]">
                Your insight is ready
              </Text>
            </View>
            <Pressable className="flex-row items-center gap-1">
              <Text className="text-neutral-500 text-[13px] font-semibold">
                View
              </Text>
              <Feather name="chevron-right" size={14} color="#737373" />
            </Pressable>
          </View>
        </View>

        {/* ── Transactions ── */}
        <View className="px-6 mt-8">
          {/* Section header */}
          <View className="flex-row justify-between items-center">
            <Text className="text-[18px] font-bold text-black">
              Transactions
            </Text>
            <View className="flex-row items-center gap-4">
              <Pressable>
                <Feather name="bookmark" size={18} color="#A3A3A3" />
              </Pressable>
              <Pressable>
                <Feather name="clock" size={18} color="#A3A3A3" />
              </Pressable>
              <Pressable className="border border-neutral-300 rounded-full px-3.5 py-1.5">
                <Text className="text-[11px] text-neutral-500 font-medium">
                  For the Period
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Date row */}
          <View className="flex-row justify-between items-center mt-5 mb-4">
            <Text className="text-[13px] text-neutral-400">
              Monday, 11 February, 2026
            </Text>
            <Text className="text-[13px] text-black font-bold">
              Total{' '}
              <Text className="text-[14px]">₹2,95,776</Text>
            </Text>
          </View>

          {/* Transaction cards */}
          {TRANSACTIONS.map((tx) => (
            <View key={tx.id} className="bg-white rounded-2xl p-4 mb-3">
              <View className="flex-row items-center">
                {/* Icon */}
                <View className="w-12 h-12 rounded-2xl bg-neutral-100 items-center justify-center">
                  <Feather name={tx.icon} size={19} color="#000" />
                </View>

                {/* Title + subtitle */}
                <View className="flex-1 ml-3.5">
                  <Text className="text-black font-bold text-[15px]">
                    {tx.title}
                  </Text>
                  <View className="flex-row items-center mt-1.5 gap-2.5">
                    {tx.subtitle ? (
                      <View className="flex-row items-center gap-1">
                        <Feather
                          name="corner-down-right"
                          size={10}
                          color="#A3A3A3"
                        />
                        <Text className="text-neutral-400 text-[11px]">
                          {tx.subtitle}
                        </Text>
                      </View>
                    ) : null}
                    {tx.tags?.map((tag) => (
                      <View
                        key={tag.label}
                        className="flex-row items-center gap-1"
                      >
                        <Feather name={tag.icon} size={10} color="#A3A3A3" />
                        <Text className="text-neutral-400 text-[11px]">
                          {tag.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Amount */}
                <View className="items-end ml-2">
                  <Text
                    className={`font-bold text-[15px] ${
                      tx.amount > 0 ? 'text-emerald-600' : 'text-black'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : '-'}₹
                    {Math.abs(tx.amount).toLocaleString()}
                  </Text>
                  {tx.balance !== undefined && (
                    <Text className="text-neutral-400 text-[11px] mt-1">
                      ₹{tx.balance.toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom spacer for tab bar */}
        <View className="h-32" />
      </View>
    </ScrollView>
  );
}
