import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { usePendingStore } from '@/lib/stores/usePendingStore';
import { formatCurrency } from '@/lib/utils/currency';
import { currentMonth, formatMonthLabel } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  dark = false,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  dark?: boolean;
}) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={
        {
          width,
          height,
          borderRadius,
          backgroundColor: dark ? 'rgba(255,255,255,0.2)' : '#E5E5E5',
          opacity,
        } as any
      }
    />
  );
}

function TransactionSkeleton() {
  return (
    <View className='bg-white rounded-2xl p-4 mb-3'>
      <View className='flex-row items-center'>
        <View className='w-12 h-12 rounded-2xl bg-neutral-100' />
        <View className='flex-1 ml-3.5 gap-2'>
          <SkeletonBox width={140} height={14} borderRadius={6} />
          <View className='flex-row gap-2'>
            <SkeletonBox width={60} height={10} borderRadius={4} />
            <SkeletonBox width={56} height={10} borderRadius={4} />
          </View>
        </View>
        <SkeletonBox width={72} height={14} borderRadius={6} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const transactions = useQuery(
    api.transactions.listByMonth,
    userId ? { userId, month: currentMonth() } : 'skip'
  );
  const monthlyStats = useQuery(
    api.transactions.getMonthlyStats,
    userId ? { userId, month: currentMonth() } : 'skip'
  );
  const totalBalance = useQuery(
    api.accounts.getTotalBalance,
    userId ? { userId } : 'skip'
  );
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');
  const pendingTxs = usePendingStore((s) => s.transactions);

  const updateHideBalance = useMutation(api.preferences.updateHideBalance);
  // Local state for instant toggle feedback; syncs from DB on first load
  const [localHidden, setLocalHidden] = useState<boolean | null>(null);
  useEffect(() => {
    if (localHidden === null && prefs !== undefined) {
      setLocalHidden(prefs.hideBalance ?? false);
    }
  }, [prefs, localHidden]);
  const isHidden = localHidden ?? prefs?.hideBalance ?? false;

  function toggleHideBalance() {
    if (!userId) return;
    const next = !isHidden;
    setLocalHidden(next);
    void updateHideBalance({ userId, hideBalance: next });
  }

  const currency = prefs?.currency ?? 'INR';
  const income = monthlyStats?.income ?? 0;
  const expenses = monthlyStats?.expenses ?? 0;

  const now = new Date();
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
        <View>
          {/* Header */}
          <View className='px-6 pt-4 flex-row justify-between items-center'>
            <View className='w-12 h-12 rounded-full bg-white/15 items-center justify-center'>
              <Feather name='user' size={20} color='#fff' />
            </View>

            <Pressable
              onPress={() =>
                router.push(`/month-detail?month=${currentMonth()}`)
              }
              className='flex-row items-center bg-white/15 rounded-full px-5 py-2.5'
            >
              <Text className='text-[13px] font-semibold text-white'>
                {formatMonthLabel(currentMonth())}
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
            <Pressable
              onPress={toggleHideBalance}
              className='flex-row items-center gap-2'
            >
              <Text className='text-neutral-500 text-[14px] tracking-widest uppercase'>
                Current Balance
              </Text>
              <Feather
                name={isHidden ? 'eye-off' : 'eye'}
                size={14}
                color='#737373'
              />
            </Pressable>
            <View className='mt-2'>
              {totalBalance === undefined ? (
                <SkeletonBox width={200} height={52} borderRadius={12} dark />
              ) : isHidden ? (
                <Text className='text-white text-[48px] font-bold tracking-tight leading-none'>
                  ******
                </Text>
              ) : (
                <Text className='text-white text-[48px] font-bold tracking-tight leading-none'>
                  {formatCurrency(totalBalance, currency)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* ===== WHITE CONTENT AREA ===== */}
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
                  {monthlyStats === undefined ? (
                    <SkeletonBox width={90} height={26} borderRadius={6} />
                  ) : (
                    <Text className='text-black text-[22px] font-bold tracking-tight'>
                      {formatCurrency(income, currency)}
                    </Text>
                  )}
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
                  {monthlyStats === undefined ? (
                    <SkeletonBox width={90} height={26} borderRadius={6} />
                  ) : (
                    <Text className='text-black text-[22px] font-bold tracking-tight'>
                      {formatCurrency(expenses, currency)}
                    </Text>
                  )}
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
            <View className='flex-row justify-between items-center'>
              <Text className='text-[18px] font-bold text-black'>
                Transactions
              </Text>
              <View className='flex-row items-center gap-4'>
                <Pressable onPress={() => router.push('/bookmarks')}>
                  <Feather name='bookmark' size={18} color='#A3A3A3' />
                </Pressable>
                <Pressable onPress={() => router.push('/subscriptions')}>
                  <Feather name='clock' size={18} color='#A3A3A3' />
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/month-detail?month=${currentMonth()}`)}
                  className='border border-neutral-300 rounded-full px-3.5 py-1.5'
                >
                  <Text className='text-[11px] text-neutral-500 font-medium'>
                    For the Period
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className='flex-row justify-between items-center mt-5 mb-4'>
              <Text className='text-[13px] text-neutral-400'>
                {todayFormatted}
              </Text>
              {transactions === undefined ? (
                <SkeletonBox width={80} height={13} borderRadius={4} />
              ) : (
                <Text className='text-[13px] text-black font-bold'>
                  {transactions.length} transactions
                </Text>
              )}
            </View>

            {transactions === undefined && pendingTxs.length === 0 ? (
              <>
                <TransactionSkeleton />
                <TransactionSkeleton />
                <TransactionSkeleton />
                <TransactionSkeleton />
                <TransactionSkeleton />
              </>
            ) : transactions !== undefined &&
              transactions.length === 0 &&
              pendingTxs.length === 0 ? (
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
              <>
                {/* Pending (offline / syncing) transactions — shown first */}
                {pendingTxs.map((tx) => (
                  <View
                    key={tx.localId}
                    className='bg-white rounded-2xl p-4 mb-3'
                  >
                    <View className='flex-row items-center'>
                      <View className='w-12 h-12 rounded-2xl bg-neutral-100 items-center justify-center'>
                        <Feather
                          name={tx.categoryIcon as any}
                          size={19}
                          color='#A3A3A3'
                        />
                      </View>
                      <View className='flex-1 ml-3.5'>
                        <Text className='text-black font-bold text-[15px]'>
                          {tx.title}
                        </Text>
                        <View className='flex-row items-center mt-1.5 gap-2.5'>
                          <View className='flex-row items-center gap-1'>
                            <Feather name='tag' size={10} color='#A3A3A3' />
                            <Text className='text-neutral-400 text-[11px]'>
                              {tx.categoryName}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className='items-end ml-2 gap-1'>
                        <Text
                          className={`font-bold text-[15px] ${tx.amount > 0 ? 'text-emerald-600' : 'text-black'}`}
                        >
                          {tx.amount > 0 ? '+' : '-'}
                          {formatCurrency(Math.abs(tx.amount), currency)}
                        </Text>
                        {/* Sync indicator */}
                        <View className='flex-row items-center gap-1'>
                          <Feather name='cloud' size={10} color='#A3A3A3' />
                          <Text className='text-neutral-400 text-[10px]'>
                            Syncing
                          </Text>
                        </View>
                      </View>
                    </View>
                    {tx.note ? (
                      <Text className='text-neutral-400 text-[12px] mt-2 ml-[62px]'>
                        {tx.note}
                      </Text>
                    ) : null}
                  </View>
                ))}

                {/* Confirmed Convex transactions */}
                {[...(transactions ?? [])]
                  .reverse()
                  .slice(0, 10)
                  .map((tx) => (
                    <Pressable
                      key={tx._id}
                      onPress={() =>
                        router.push(`/transaction-detail?id=${tx._id}`)
                      }
                      className='bg-white rounded-2xl p-4 mb-3'
                    >
                      <View className='flex-row items-center'>
                        <View
                          className='w-12 h-12 rounded-2xl items-center justify-center'
                          style={{ backgroundColor: `${tx.categoryColor}18` }}
                        >
                          <Feather
                            name={tx.categoryIcon as any}
                            size={19}
                            color={tx.categoryColor}
                          />
                        </View>
                        <View className='flex-1 ml-3.5'>
                          <Text className='text-black font-bold text-[15px]'>
                            {tx.title}
                          </Text>
                          <View className='flex-row items-center mt-1.5 gap-2.5'>
                            <View className='flex-row items-center gap-1'>
                              <Feather name='tag' size={10} color='#A3A3A3' />
                              <Text className='text-neutral-400 text-[11px]'>
                                {tx.categoryName}
                              </Text>
                            </View>
                            {tx.accountName ? (
                              <View className='flex-row items-center gap-1'>
                                <Feather
                                  name='credit-card'
                                  size={10}
                                  color='#A3A3A3'
                                />
                                <Text className='text-neutral-400 text-[11px]'>
                                  {tx.accountName}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <View className='items-end ml-2'>
                          <Text
                            className={`font-bold text-[15px] ${tx.amount > 0 ? 'text-emerald-600' : 'text-black'}`}
                          >
                            {tx.amount > 0 ? '+' : '-'}
                            {formatCurrency(Math.abs(tx.amount), currency)}
                          </Text>
                        </View>
                      </View>
                      {tx.note ? (
                        <Text className='text-neutral-400 text-[12px] mt-2 ml-[62px]'>
                          {tx.note}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
              </>
            )}

            {transactions !== undefined && transactions.length > 10 && (
              <Pressable
                onPress={() =>
                  router.push(`/month-detail?month=${currentMonth()}`)
                }
                className='flex-row items-center justify-center bg-white rounded-2xl p-4 mb-3 gap-2'
              >
                <Text className='text-[14px] font-semibold text-black'>
                  View all {transactions.length} transactions
                </Text>
                <Feather name='arrow-right' size={15} color='#000' />
              </Pressable>
            )}
          </View>

          <View className='h-32' />
        </View>
      </ScrollView>
    </>
  );
}
