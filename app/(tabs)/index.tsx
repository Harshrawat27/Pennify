import { getAllAccounts } from '@/lib/dal';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { useTransactionStore } from '@/lib/stores/useTransactionStore';
import { formatCurrency } from '@/lib/utils/currency';
import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const transactions = useTransactionStore((s) => s.transactions);
  const income = useTransactionStore((s) => s.income);
  const expenses = useTransactionStore((s) => s.expenses);

  const currency = useSettingsStore((s) => s.currency);
  const accounts = getAllAccounts();
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Format current month/year for display
  const now = new Date();
  const monthName = now.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Group transactions by date
  const today = now.toISOString().split('T')[0];
  const todayFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <ScrollView
        className='flex-1 bg-black'
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ===== BLACK HERO AREA ===== */}
        <View style={{ paddingTop: insets.top }}>
          {/* Header */}
          <View className='px-6 pt-4 flex-row justify-between items-center'>
            <View className='w-12 h-12 rounded-full bg-white/15 items-center justify-center'>
              <Feather name='user' size={20} color='#fff' />
            </View>

            <Pressable className='flex-row items-center bg-white/15 rounded-full px-5 py-2.5'>
              <Text className='text-[13px] font-semibold text-white'>
                {monthName}
              </Text>
              <Feather
                name='chevron-down'
                size={14}
                color='#fff'
                style={{ marginLeft: 6 }}
              />
            </Pressable>

            <View className='relative'>
              <Pressable className='w-12 h-12 rounded-full bg-white/15 items-center justify-center'>
                <Feather name='bell' size={20} color='#fff' />
              </Pressable>
              <View className='absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-black' />
            </View>
          </View>

          {/* Balance */}
          <View className='items-center pt-10 pb-16'>
            <Text className='text-neutral-500 text-[14px] tracking-widest uppercase'>
              Current Balance
            </Text>
            <Text className='text-white text-[48px] font-bold mt-2 tracking-tight leading-none'>
              {formatCurrency(totalBalance, currency)}
            </Text>
          </View>
        </View>

        {/* ===== WHITE CONTENT AREA (overlaps hero) ===== */}
        <View className='bg-neutral-50 rounded-t-[32px] -mt-4'>
          {/* ── Your Money ── */}
          <View className='px-6 pt-7'>
            <View className='flex-row justify-between items-center'>
              <View className='flex-row items-center gap-2'>
                <Text className='text-[18px] font-bold text-black'>
                  Your Money
                </Text>
                <Feather name='info' size={15} color='#D4D4D4' />
              </View>
              <Pressable className='flex-row items-center gap-1'>
                <Text className='text-[13px] text-neutral-400 font-medium'>
                  Details
                </Text>
                <Feather name='chevron-right' size={15} color='#A3A3A3' />
              </Pressable>
            </View>

            <View className='flex-row gap-3 mt-5'>
              {/* Income Card */}
              <View className='flex-1 bg-white rounded-2xl p-5 pb-5'>
                <View className='w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center'>
                  <Feather name='arrow-up-right' size={20} color='#000' />
                </View>
                <View className='mt-8'>
                  <View className='flex-row items-center gap-1.5 mb-1'>
                    <Text className='text-neutral-400 text-[13px]'>Income</Text>
                    <Feather name='info' size={11} color='#D4D4D4' />
                  </View>
                  <Text className='text-black text-[22px] font-bold tracking-tight'>
                    {formatCurrency(income, currency)}
                  </Text>
                </View>
              </View>

              {/* Expenses Card */}
              <View className='flex-1 bg-white rounded-2xl p-5 pb-5'>
                <View className='w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center'>
                  <Feather name='arrow-down-right' size={20} color='#000' />
                </View>
                <View className='mt-8'>
                  <View className='flex-row items-center gap-1.5 mb-1'>
                    <Text className='text-neutral-400 text-[13px]'>
                      Expenses
                    </Text>
                    <Feather name='info' size={11} color='#D4D4D4' />
                  </View>
                  <Text className='text-black text-[22px] font-bold tracking-tight'>
                    {formatCurrency(expenses, currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Insight Banner ── */}
          <View className='mx-6 mt-6'>
            <View className='bg-black rounded-2xl px-5 py-4 flex-row items-center justify-between'>
              <View className='flex-row items-center gap-2.5'>
                <Text className='text-[14px]'>✨</Text>
                <Text className='text-white font-semibold text-[13px]'>
                  Your insight is ready
                </Text>
              </View>
              <Pressable className='flex-row items-center gap-1'>
                <Text className='text-neutral-500 text-[13px] font-semibold'>
                  View
                </Text>
                <Feather name='chevron-right' size={14} color='#737373' />
              </Pressable>
            </View>
          </View>

          {/* ── Transactions ── */}
          <View className='px-6 mt-8'>
            {/* Section header */}
            <View className='flex-row justify-between items-center'>
              <Text className='text-[18px] font-bold text-black'>
                Transactions
              </Text>
              <View className='flex-row items-center gap-4'>
                <Pressable>
                  <Feather name='bookmark' size={18} color='#A3A3A3' />
                </Pressable>
                <Pressable>
                  <Feather name='clock' size={18} color='#A3A3A3' />
                </Pressable>
                <Pressable className='border border-neutral-300 rounded-full px-3.5 py-1.5'>
                  <Text className='text-[11px] text-neutral-500 font-medium'>
                    For the Period
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Date row */}
            <View className='flex-row justify-between items-center mt-5 mb-4'>
              <Text className='text-[13px] text-neutral-400'>
                {todayFormatted}
              </Text>
              <Text className='text-[13px] text-black font-bold'>
                {transactions.length} transactions
              </Text>
            </View>

            {/* Transaction cards */}
            {transactions.length === 0 ? (
              <View className='bg-white rounded-2xl p-8 items-center'>
                <Feather name='inbox' size={32} color='#D4D4D4' />
                <Text className='text-neutral-400 text-[14px] mt-3'>
                  No transactions yet
                </Text>
                <Text className='text-neutral-300 text-[12px] mt-1'>
                  Tap + to add one
                </Text>
              </View>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} className='bg-white rounded-2xl p-4 mb-3'>
                  <View className='flex-row items-center'>
                    {/* Icon */}
                    <View className='w-12 h-12 rounded-2xl bg-neutral-100 items-center justify-center'>
                      <Feather name={tx.category_icon} size={19} color='#000' />
                    </View>

                    {/* Title + subtitle */}
                    <View className='flex-1 ml-3.5'>
                      <Text className='text-black font-bold text-[15px]'>
                        {tx.title}
                      </Text>
                      <View className='flex-row items-center mt-1.5 gap-2.5'>
                        {tx.note ? (
                          <View className='flex-row items-center gap-1'>
                            <Feather
                              name='corner-down-right'
                              size={10}
                              color='#A3A3A3'
                            />
                            <Text className='text-neutral-400 text-[11px]'>
                              {tx.note}
                            </Text>
                          </View>
                        ) : null}
                        <View className='flex-row items-center gap-1'>
                          <Feather name='tag' size={10} color='#A3A3A3' />
                          <Text className='text-neutral-400 text-[11px]'>
                            {tx.category_name}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Amount */}
                    <View className='items-end ml-2'>
                      <Text
                        className={`font-bold text-[15px] ${
                          tx.amount > 0 ? 'text-emerald-600' : 'text-black'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Bottom spacer for tab bar */}
          <View className='h-32' />
        </View>
      </ScrollView>
    </>
  );
}
