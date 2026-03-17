import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { usePendingStore } from '@/lib/stores/usePendingStore';
import { formatCurrency } from '@/lib/utils/currency';
import { currentMonth, formatMonthLabel } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Circle, Svg } from 'react-native-svg';
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
  const monthlyBudgetData = useQuery(
    api.monthlyBudgets.getByMonth,
    userId ? { userId, month: currentMonth() } : 'skip'
  );
  const totalBalance = useQuery(
    api.accounts.getTotalBalance,
    userId ? { userId } : 'skip'
  );
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');
  const pendingTxs = usePendingStore((s) => s.transactions);

  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  const notifications = useQuery(
    api.notifications.getNotifications,
    userId ? { userId } : 'skip'
  );
  const hasAlerts = (notifications?.length ?? 0) > 0;
  const updateHideBalance = useMutation(api.preferences.updateHideBalance);
  const updateBalance = useMutation(api.preferences.updateBalance);
  // Local state for instant toggle feedback; syncs from DB on first load
  const [localHidden, setLocalHidden] = useState<boolean | null>(null);
  useEffect(() => {
    if (localHidden === null && prefs !== undefined) {
      setLocalHidden(prefs.hideBalance ?? false);
    }
  }, [prefs, localHidden]);
  const isHidden = localHidden ?? prefs?.hideBalance ?? false;

  async function handleSaveBalance() {
    if (!userId) return;
    const desired = parseFloat(balanceInput);
    if (isNaN(desired)) return;
    setIsSavingBalance(true);
    try {
      await updateBalance({ userId, desiredBalance: desired });
      setShowEditBalance(false);
      setBalanceInput('');
    } finally {
      setIsSavingBalance(false);
    }
  }

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
            <Pressable
              onPress={() => setShowProfile(true)}
              className='w-12 h-12 rounded-full bg-white/15 items-center justify-center'
            >
              {session?.user?.name ? (
                <Text className='text-white font-bold text-[16px]'>
                  {session.user.name
                    .split(' ')
                    .map((w: string) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </Text>
              ) : (
                <Feather name='user' size={20} color='#fff' />
              )}
            </Pressable>

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
              <Pressable
                onPress={() => setShowNotifications(true)}
                className='w-12 h-12 rounded-full bg-white/15 items-center justify-center'
              >
                <Feather name='bell' size={20} color='#fff' />
              </Pressable>
              {hasAlerts && (
                <View className='absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-black' />
              )}
            </View>
          </View>

          {/* Balance */}
          {(() => {
            const isBudgetMode = prefs !== undefined && prefs.overallBalance == null;
            const budgetRemaining = (monthlyBudgetData?.budget ?? 0) - expenses;
            const displayValue = isBudgetMode ? budgetRemaining : totalBalance;
            const isLoading = isBudgetMode
              ? monthlyStats === undefined || monthlyBudgetData === undefined
              : totalBalance === undefined;

            return (
              <View className='items-center pt-10 pb-16'>
                <View className='flex-row items-center gap-2'>
                  <Pressable
                    onPress={toggleHideBalance}
                    className='flex-row items-center gap-2'
                  >
                    <Text className='text-neutral-500 text-[14px] tracking-widest uppercase'>
                      {isBudgetMode ? 'Budget Remaining' : 'Current Balance'}
                    </Text>
                    <Feather
                      name={isHidden ? 'eye-off' : 'eye'}
                      size={14}
                      color='#737373'
                    />
                  </Pressable>
                  {!isBudgetMode && (
                    <Pressable
                      onPress={() => {
                        setBalanceInput(
                          totalBalance !== undefined
                            ? String(Math.round(totalBalance))
                            : ''
                        );
                        setShowEditBalance(true);
                      }}
                      className='w-6 h-6 rounded-full bg-white/15 items-center justify-center'
                    >
                      <Feather name='edit-2' size={11} color='#737373' />
                    </Pressable>
                  )}
                </View>
                <View className='mt-2'>
                  {isLoading ? (
                    <SkeletonBox width={200} height={52} borderRadius={12} dark />
                  ) : isHidden ? (
                    <Text className='text-white text-[48px] font-bold tracking-tight leading-none'>
                      ******
                    </Text>
                  ) : (
                    <Text className='text-white text-[48px] font-bold tracking-tight leading-none'>
                      {formatCurrency(displayValue ?? 0, currency)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })()}
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
              <Pressable
                onPress={() => router.push('/(tabs)/report')}
                className='flex-row items-center gap-1'
              >
                <Text className='text-[13px] text-neutral-400 font-medium'>
                  Details
                </Text>
                <Feather name='chevron-right' size={15} color='#A3A3A3' />
              </Pressable>
            </View>

            <View className='flex-row gap-3 mt-5'>
              {/* Income Card */}
              <View className='flex-1 bg-white rounded-2xl p-5 pb-5 justify-center'>
                <View className='w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center mb-4'>
                  <Feather name='arrow-up-right' size={20} color='#000' />
                </View>
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

              {/* Expenses — floating circle, no card box */}
              <View className='flex-1 items-center justify-center'>
                {monthlyStats === undefined ? (
                  <SkeletonBox width={130} height={130} borderRadius={65} />
                ) : (
                  (() => {
                    const RADIUS = 56;
                    const STROKE = 7;
                    const SIZE = (RADIUS + STROKE) * 2;
                    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
                    const budget = monthlyBudgetData?.budget ?? 0;
                    const denominator =
                      budget > 0 ? budget : income > 0 ? income : 0;
                    const pct =
                      denominator > 0 ? Math.min(expenses / denominator, 1) : 0;
                    const offset = CIRCUMFERENCE * (1 - pct);
                    const pctLabel =
                      denominator > 0
                        ? Math.round((expenses / denominator) * 100)
                        : 0;
                    return (
                      <View style={{ width: SIZE, height: SIZE }}>
                        <Svg
                          width={SIZE}
                          height={SIZE}
                          style={{ transform: [{ rotate: '-90deg' }] }}
                        >
                          <Circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={RADIUS}
                            stroke='#E5E5E5'
                            strokeWidth={STROKE}
                            fill='none'
                          />
                          <Circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={RADIUS}
                            stroke='#000'
                            strokeWidth={STROKE}
                            fill='none'
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={offset}
                            strokeLinecap='round'
                          />
                        </Svg>
                        <View className='absolute inset-0 items-center justify-center gap-0.5'>
                          <Text className='text-black text-[26px] font-bold tracking-tight leading-none'>
                            {pctLabel}%
                          </Text>
                          <Text className='text-neutral-400 text-[10px] font-medium uppercase tracking-wide'>
                            spent
                          </Text>
                          <Text className='text-black text-[12px] font-semibold mt-1'>
                            {formatCurrency(expenses, currency)}
                          </Text>
                        </View>
                      </View>
                    );
                  })()
                )}
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
                  onPress={() =>
                    router.push(`/month-detail?month=${currentMonth()}`)
                  }
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
                        <View className='w-12 h-12 rounded-2xl bg-neutral-100 items-center justify-center'>
                          <Feather
                            name={tx.categoryIcon as any}
                            size={19}
                            color='#000'
                          />
                        </View>
                        <View className='flex-1 ml-3.5'>
                          <Text className='text-black font-bold text-[15px]'>
                            {tx.title}
                          </Text>
                          <View className='flex-row items-center mt-1.5 gap-2'>
                            <View
                              className='px-2 py-0.5 rounded-full'
                              style={{
                                backgroundColor: `${tx.categoryColor}18`,
                              }}
                            >
                              <Text
                                className='text-[10px] font-medium'
                                style={{ color: tx.categoryColor }}
                              >
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

      {/* Edit Balance Modal */}
      <Modal
        visible={showEditBalance}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowEditBalance(false)}
      >
        <KeyboardAvoidingView
          className='flex-1 bg-neutral-50'
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className='items-center pt-3 pb-1'>
            <View className='w-10 h-1 rounded-full bg-neutral-200' />
          </View>
          <View className='px-6 pt-4 pb-4 flex-row justify-between items-center'>
            <Text className='text-[20px] font-bold text-black'>
              Edit Balance
            </Text>
            <Pressable
              onPress={() => setShowEditBalance(false)}
              className='w-9 h-9 rounded-full bg-neutral-100 items-center justify-center'
            >
              <Feather name='x' size={18} color='#000' />
            </Pressable>
          </View>

          <View className='mx-6 mt-2 bg-white rounded-2xl p-5'>
            <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>
              What should your balance show?
            </Text>
            <View className='flex-row items-center'>
              <Text className='text-[32px] font-bold text-black mr-1'>
                {currency === 'INR'
                  ? '₹'
                  : currency === 'USD'
                    ? '$'
                    : currency === 'EUR'
                      ? '€'
                      : currency}
              </Text>
              <TextInput
                value={balanceInput}
                onChangeText={setBalanceInput}
                placeholder='0'
                placeholderTextColor='#D4D4D4'
                keyboardType='decimal-pad'
                className='flex-1 text-[32px] font-bold text-black'
                autoFocus
              />
            </View>
          </View>

          <View className='mx-6 mt-3 bg-neutral-100 rounded-2xl px-4 py-3 flex-row items-start gap-2'>
            <Feather
              name='info'
              size={13}
              color='#A3A3A3'
              style={{ marginTop: 2 }}
            />
            <Text className='flex-1 text-[12px] text-neutral-400 leading-relaxed'>
              This sets what your balance displays as right now. Your existing
              transactions stay untouched — we'll adjust the offset
              automatically.
            </Text>
          </View>

          <View className='mx-6 mt-6'>
            <Pressable
              onPress={handleSaveBalance}
              disabled={isSavingBalance || !balanceInput}
              className={`py-4 rounded-2xl items-center ${balanceInput && !isSavingBalance ? 'bg-black' : 'bg-neutral-300'}`}
            >
              <Text className='text-white font-bold text-[16px]'>
                {isSavingBalance ? 'Saving...' : 'Update Balance'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notifications bottom sheet */}
      <Modal
        visible={showNotifications}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowNotifications(false)}
      >
        <View className='flex-1 bg-neutral-50'>
          <View className='items-center pt-3 pb-1'>
            <View className='w-10 h-1 rounded-full bg-neutral-200' />
          </View>
          <View className='px-6 pt-4 pb-4 flex-row justify-between items-center'>
            <Text className='text-[20px] font-bold text-black'>
              Notifications
            </Text>
            <Pressable
              onPress={() => setShowNotifications(false)}
              className='w-9 h-9 rounded-full bg-neutral-100 items-center justify-center'
            >
              <Feather name='x' size={18} color='#000' />
            </Pressable>
          </View>

          <ScrollView
            className='flex-1'
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          >
            {notifications === undefined ? (
              <View className='items-center py-12'>
                <Feather name='loader' size={24} color='#D4D4D4' />
              </View>
            ) : notifications.length === 0 ? (
              <View className='bg-white rounded-2xl p-10 items-center mt-2'>
                <Feather name='check-circle' size={32} color='#D4D4D4' />
                <Text className='text-neutral-400 text-[14px] font-medium mt-3'>
                  You're all caught up!
                </Text>
                <Text className='text-neutral-300 text-[12px] mt-1 text-center'>
                  No upcoming payments or budget alerts
                </Text>
              </View>
            ) : (
              <>
                {/* Budget alerts first */}
                {notifications
                  .filter(
                    (n) => n.type === 'budget_80' || n.type === 'budget_100'
                  )
                  .map((n, i) => {
                    if (n.type !== 'budget_80' && n.type !== 'budget_100')
                      return null;
                    const isOver = n.type === 'budget_100';
                    return (
                      <View
                        key={`budget-${i}`}
                        className='bg-white rounded-2xl p-4 mb-3 flex-row items-center gap-4'
                      >
                        <View
                          className={`w-11 h-11 rounded-2xl items-center justify-center ${isOver ? 'bg-red-50' : 'bg-orange-50'}`}
                        >
                          <Feather
                            name='alert-triangle'
                            size={18}
                            color={isOver ? '#EF4444' : '#F97316'}
                          />
                        </View>
                        <View className='flex-1'>
                          <Text className='text-[14px] font-bold text-black'>
                            {isOver ? 'Budget Exceeded!' : 'Budget Alert — 80%'}
                          </Text>
                          <Text className='text-[12px] text-neutral-400 mt-0.5'>
                            {isOver
                              ? `You've spent ${n.percent}% of your monthly budget`
                              : `You've used ${n.percent}% of your monthly budget`}
                          </Text>
                          <View className='h-1.5 bg-neutral-100 rounded-full mt-2'>
                            <View
                              className='h-1.5 rounded-full'
                              style={{
                                width: `${Math.min(n.percent, 100)}%`,
                                backgroundColor: isOver ? '#EF4444' : '#F97316',
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}

                {/* Recurring payment alerts */}
                {notifications.filter((n) => n.type === 'recurring_due')
                  .length > 0 && (
                  <Text className='text-[12px] text-neutral-400 font-semibold uppercase tracking-wider mb-2 mt-1'>
                    Upcoming Payments
                  </Text>
                )}
                {notifications
                  .filter((n) => n.type === 'recurring_due')
                  .map((n) => {
                    if (n.type !== 'recurring_due') return null;
                    const isToday = n.daysUntil === 0;
                    const isTomorrow = n.daysUntil === 1;
                    const label = isToday
                      ? 'Due today'
                      : isTomorrow
                        ? 'Due tomorrow'
                        : `Due in ${n.daysUntil} days`;
                    return (
                      <Pressable
                        key={n.id}
                        onPress={() => {
                          setShowNotifications(false);
                          router.push('/subscriptions');
                        }}
                        className='bg-white rounded-2xl p-4 mb-3 flex-row items-center gap-4'
                      >
                        <View
                          className={`w-11 h-11 rounded-2xl items-center justify-center ${isToday || isTomorrow ? 'bg-red-50' : 'bg-neutral-100'}`}
                        >
                          <Feather
                            name='repeat'
                            size={18}
                            color={isToday || isTomorrow ? '#EF4444' : '#000'}
                          />
                        </View>
                        <View className='flex-1'>
                          <Text className='text-[14px] font-bold text-black'>
                            {n.name}
                          </Text>
                          <Text className='text-[12px] text-neutral-400 mt-0.5'>
                            {label} · {n.nextDue}
                          </Text>
                        </View>
                        <Text
                          className={`text-[14px] font-bold ${isToday || isTomorrow ? 'text-red-500' : 'text-black'}`}
                        >
                          {formatCurrency(n.amount, currency)}
                        </Text>
                      </Pressable>
                    );
                  })}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Profile bottom sheet */}
      <Modal
        visible={showProfile}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowProfile(false)}
      >
        <View className='flex-1 bg-neutral-50'>
          {/* Handle + close */}
          <View className='items-center pt-3 pb-1'>
            <View className='w-10 h-1 rounded-full bg-neutral-200' />
          </View>
          <View className='px-6 pt-4 pb-4 flex-row justify-between items-center'>
            <Text className='text-[20px] font-bold text-black'>Profile</Text>
            <Pressable
              onPress={() => setShowProfile(false)}
              className='w-9 h-9 rounded-full bg-neutral-100 items-center justify-center'
            >
              <Feather name='x' size={18} color='#000' />
            </Pressable>
          </View>

          {/* Avatar + name + email */}
          <View className='items-center pt-6 pb-8'>
            <View className='w-20 h-20 rounded-full bg-black items-center justify-center mb-4'>
              <Text className='text-white font-bold text-[28px]'>
                {session?.user?.name
                  ? session.user.name
                      .split(' ')
                      .map((w: string) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : '?'}
              </Text>
            </View>
            <Text className='text-[20px] font-bold text-black'>
              {session?.user?.name ?? '—'}
            </Text>
            <Text className='text-[13px] text-neutral-400 mt-1'>
              {session?.user?.email ?? '—'}
            </Text>
          </View>

          {/* Actions */}
          <View className='mx-6 bg-white rounded-2xl overflow-hidden'>
            <Pressable
              onPress={() => {
                setShowProfile(false);
                router.push('/(tabs)/settings');
              }}
              className='flex-row items-center px-5 py-4 border-b border-neutral-100'
            >
              <View className='w-8 h-8 rounded-lg bg-neutral-100 items-center justify-center mr-3'>
                <Feather name='settings' size={16} color='#000' />
              </View>
              <Text className='flex-1 text-[15px] font-medium text-black'>
                Settings
              </Text>
              <Feather name='chevron-right' size={16} color='#A3A3A3' />
            </Pressable>
            <Pressable
              onPress={() => {
                setShowProfile(false);
                router.push('/accounts');
              }}
              className='flex-row items-center px-5 py-4'
            >
              <View className='w-8 h-8 rounded-lg bg-neutral-100 items-center justify-center mr-3'>
                <Feather name='credit-card' size={16} color='#000' />
              </View>
              <Text className='flex-1 text-[15px] font-medium text-black'>
                Accounts
              </Text>
              <Feather name='chevron-right' size={16} color='#A3A3A3' />
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
