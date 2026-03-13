import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { formatCurrencyCompact } from '@/lib/utils/currency';
import { currentMonth, formatDateShort } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
function monthsUntil(dateStr: string): number {
  const today = new Date();
  const due = new Date(dateStr);
  const months =
    (due.getFullYear() - today.getFullYear()) * 12 +
    (due.getMonth() - today.getMonth());
  return Math.max(months, 0);
}

export default function PlanScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [historyGoalId, setHistoryGoalId] = useState<string | null>(null);

  const month = currentMonth();
  const goals = useQuery(api.goals.list, userId ? { userId } : 'skip');
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');
  const budgets = useQuery(api.budgets.listByMonthWithComparison, userId ? { userId, month } : 'skip');
  const spendingInsights = useQuery(api.transactions.getCategorySpendingInsights, userId ? { userId, month } : 'skip');
  const contributions = useQuery(
    api.goals.listContributions,
    historyGoalId ? { goalId: historyGoalId as any } : 'skip',
  );

  const addContribution = useMutation(api.goals.addContribution);
  const markCompleted = useMutation(api.goals.markCompleted);
  const markPaid = useMutation(api.goals.markPaid);
  const removeGoal = useMutation(api.goals.remove);

  const currency = prefs?.currency ?? 'INR';

  const activeGoals = (goals ?? []).filter((g) => g.status !== 'completed');
  const completedGoals = (goals ?? []).filter((g) => g.status === 'completed');
  const selectedGoal = goals?.find((g) => g._id === contributionGoalId);
  const historyGoal = goals?.find((g) => g._id === historyGoalId);

  async function handleContribute() {
    if (!userId || !contributionGoalId) return;
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) return;
    await addContribution({ userId, goalId: contributionGoalId as any, amount });
    setContributionGoalId(null);
    setContributionAmount('');
  }

  function handleDelete(goal: any) {
    Alert.alert(
      'Delete Goal',
      goal.saved > 0
        ? `${formatCurrencyCompact(goal.saved, currency)} saved will be refunded back to your balance.`
        : `"${goal.name}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeGoal({ id: goal._id, userId: userId! }),
        },
      ]
    );
  }

  function handleMarkPaid(goal: any) {
    if (!userId) return;
    Alert.alert(
      'Mark as Paid',
      `This will create a transaction for ${formatCurrencyCompact(goal.target, currency)} tagged "Paid from Goal" and reset the goal savings to ₹0 for next year.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: () => markPaid({ id: goal._id, userId }),
        },
      ]
    );
  }

  function handleMarkComplete(goal: any) {
    const pct = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
    if (pct < 100) return;
    Alert.alert(
      'Goal Achieved!',
      `Mark "${goal.name}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => markCompleted({ id: goal._id }),
        },
      ]
    );
  }

  return (
    <>
      <ScrollView
        className='flex-1 bg-neutral-50'
        contentContainerStyle={{}}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className='px-6 pt-4 pb-2'>
          <Text className='text-[22px] font-bold text-black tracking-tight'>Plan</Text>
        </View>

        {/* ── BUDGETS SECTION ── */}
        <View className='px-6 mt-4'>
          <View className='flex-row items-center justify-between mb-3'>
            <Text className='text-[17px] font-bold text-black'>Budgets</Text>
            <Pressable
              onPress={() => router.push('/add-budget')}
              className='w-8 h-8 rounded-full bg-white items-center justify-center'
            >
              <Feather name='plus' size={16} color='#000' />
            </Pressable>
          </View>

          {budgets === undefined ? null : budgets.length === 0 ? (
            <View className='bg-white rounded-2xl p-5 items-center'>
              <View className='w-12 h-12 rounded-full bg-neutral-100 items-center justify-center mb-3'>
                <Feather name='sliders' size={20} color='#A3A3A3' />
              </View>
              <Text className='text-[14px] font-semibold text-black'>No budgets set</Text>
              <Text className='text-neutral-400 text-[12px] mt-1 text-center'>
                Tap + to set a spending limit per category
              </Text>
            </View>
          ) : (
            budgets.map((b) => {
              const pct = b.limitAmount > 0 ? Math.min((b.spent / b.limitAmount) * 100, 100) : 0;
              const isOver = b.spent > b.limitAmount;
              const isWarning = !isOver && pct >= 80;
              const barColor = isOver ? '#EF4444' : isWarning ? '#F97316' : '#000';
              const hasLastMonth = (b as any).lastMonthSpent > 0;
              const delta = hasLastMonth
                ? Math.round(((b.spent - (b as any).lastMonthSpent) / (b as any).lastMonthSpent) * 100)
                : null;
              const parentColor = (b as any).parentColor ?? '#6B7280';
              const parentIcon = (b as any).parentIcon ?? 'tag';
              const parentName = (b as any).parentName ?? 'Unknown';

              return (
                <View key={b._id} className='bg-white rounded-2xl p-4 mb-3'>
                  <View className='flex-row items-center gap-3 mb-3'>
                    <View
                      className='w-10 h-10 rounded-xl items-center justify-center'
                      style={{ backgroundColor: `${parentColor}18` }}
                    >
                      <Feather name={parentIcon as any} size={16} color={parentColor} />
                    </View>
                    <View className='flex-1'>
                      <Text className='text-[14px] font-semibold text-black'>{parentName}</Text>
                      {delta !== null && (
                        <View className='flex-row items-center gap-1 mt-0.5'>
                          <Feather
                            name={delta > 0 ? 'arrow-up' : 'arrow-down'}
                            size={10}
                            color={delta > 0 ? '#EF4444' : '#16A34A'}
                          />
                          <Text
                            className='text-[11px] font-medium'
                            style={{ color: delta > 0 ? '#EF4444' : '#16A34A' }}
                          >
                            {Math.abs(delta)}% vs last month
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className='items-end'>
                      <Text className='text-[14px] font-bold text-black'>
                        {formatCurrencyCompact(b.spent, currency)}
                      </Text>
                      <Text className='text-[11px] text-neutral-400'>
                        of {formatCurrencyCompact(b.limitAmount, currency)}
                      </Text>
                    </View>
                  </View>
                  <View className='h-1.5 bg-neutral-100 rounded-full'>
                    <View
                      className='h-1.5 rounded-full'
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </View>
                  {isOver && (
                    <Text className='text-[11px] text-red-500 font-medium mt-1.5'>
                      Over budget by {formatCurrencyCompact(b.spent - b.limitAmount, currency)}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ── SPENDING INSIGHTS SECTION ── */}
        {spendingInsights && spendingInsights.length > 0 && (
          <View className='px-6 mt-6'>
            <Text className='text-[17px] font-bold text-black mb-3'>This Month</Text>
            <View className='bg-white rounded-2xl px-4'>
              {spendingInsights.map((s, i) => {
                const budgeted = false; // budgets are at parent level — tracked separately
                const hasLast = s.lastMonth > 0;
                const delta = hasLast
                  ? Math.round(((s.thisMonth - s.lastMonth) / s.lastMonth) * 100)
                  : null;
                return (
                  <View
                    key={s.categoryId}
                    className={`flex-row items-center py-3.5 ${i < spendingInsights.length - 1 ? 'border-b border-neutral-100' : ''}`}
                  >
                    <View
                      className='w-9 h-9 rounded-xl items-center justify-center mr-3'
                      style={{ backgroundColor: `${s.categoryColor}18` }}
                    >
                      <Feather name={s.categoryIcon as any} size={15} color={s.categoryColor} />
                    </View>
                    <View className='flex-1'>
                      <Text className='text-[14px] font-medium text-black'>{s.categoryName}</Text>
                      {delta !== null && (
                        <View className='flex-row items-center gap-1 mt-0.5'>
                          <Feather
                            name={delta > 0 ? 'arrow-up' : 'arrow-down'}
                            size={10}
                            color={delta > 0 ? '#EF4444' : '#16A34A'}
                          />
                          <Text
                            className='text-[11px]'
                            style={{ color: delta > 0 ? '#EF4444' : '#16A34A' }}
                          >
                            {Math.abs(delta)}% vs last month
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className='items-end gap-1'>
                      <Text className='text-[14px] font-semibold text-black'>
                        {formatCurrencyCompact(s.thisMonth, currency)}
                      </Text>
                      {!budgeted && (
                        <Pressable onPress={() => router.push('/add-budget')}>
                          <Text className='text-[11px] text-neutral-400 underline'>Set limit</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── GOALS SECTION ── */}
        <View className='px-6 mt-6 flex-row justify-between items-center mb-2'>
          <Text className='text-[17px] font-bold text-black'>Goals</Text>
          <Pressable
            onPress={() => router.push('/add-goal')}
            className='w-8 h-8 rounded-full bg-white items-center justify-center'
          >
            <Feather name='plus' size={16} color='#000' />
          </Pressable>
        </View>

        {/* Active Goals */}
        <View className='px-6'>
          {activeGoals.length === 0 && completedGoals.length === 0 ? (
            <View className='bg-white rounded-2xl p-8 items-center'>
              <View className='w-16 h-16 rounded-full bg-neutral-100 items-center justify-center mb-4'>
                <Feather name='target' size={28} color='#A3A3A3' />
              </View>
              <Text className='text-[15px] font-semibold text-black'>
                No goals yet
              </Text>
              <Text className='text-neutral-400 text-[13px] mt-1 text-center'>
                Tap + to create your first saving goal
              </Text>
            </View>
          ) : (
            activeGoals.map((g) => {
              const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
              const isComplete = pct >= 100;

              // Monthly needed calc for sinking fund goals
              const remaining = g.target - g.saved;
              const months = g.nextDue ? monthsUntil(g.nextDue) : 0;
              const monthlyNeeded = months > 0 ? Math.ceil(remaining / months) : null;
              const isPaymentDue = g.paymentDue === true;
              const isSinkingFund = g.isRecurring === true;

              return (
                <View key={g._id} className='bg-white rounded-2xl p-5 mb-3'>
                  {/* Payment due warning */}
                  {isPaymentDue && (
                    <View className='bg-red-50 rounded-xl px-3 py-2.5 mb-4 flex-row items-center gap-2'>
                      <Feather name='alert-circle' size={14} color='#EF4444' />
                      <Text className='flex-1 text-[12px] text-red-500 font-medium'>
                        Payment due — top up your goal and mark as paid
                      </Text>
                    </View>
                  )}

                  {/* Goal info row */}
                  <View className='flex-row items-center gap-3'>
                    <View
                      className='w-12 h-12 rounded-2xl items-center justify-center'
                      style={{ backgroundColor: g.color + '20' }}
                    >
                      <Feather name={g.icon as any} size={20} color={g.color} />
                    </View>
                    <View className='flex-1'>
                      <View className='flex-row items-center gap-2'>
                        <Text className='text-[15px] font-semibold text-black'>{g.name}</Text>
                        {isSinkingFund && (
                          <View className='bg-neutral-100 px-2 py-0.5 rounded-full'>
                            <Text className='text-[10px] font-medium text-neutral-400'>Yearly</Text>
                          </View>
                        )}
                      </View>
                      <Text className='text-[12px] text-neutral-400 mt-0.5'>
                        {pct}% saved
                      </Text>
                    </View>
                    <View className='items-end'>
                      <Text className='text-[16px] font-bold text-black'>
                        {formatCurrencyCompact(g.saved, currency)}
                      </Text>
                      <Text className='text-[12px] text-neutral-400'>
                        of {formatCurrencyCompact(g.target, currency)}
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View className='h-1.5 bg-neutral-100 rounded-full mt-4'>
                    <View
                      className='h-1.5 rounded-full'
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: isPaymentDue ? '#EF4444' : g.color,
                      }}
                    />
                  </View>

                  {/* Monthly needed hint for sinking fund goals */}
                  {isSinkingFund && !isPaymentDue && monthlyNeeded !== null && remaining > 0 && (
                    <View className='mt-3 flex-row items-center gap-1.5'>
                      <Feather name='trending-up' size={12} color='#A3A3A3' />
                      <Text className='text-[12px] text-neutral-400'>
                        Save{' '}
                        <Text className='font-semibold text-black'>
                          {formatCurrencyCompact(monthlyNeeded, currency)}/mo
                        </Text>
                        {months > 0 ? ` for ${months} month${months !== 1 ? 's' : ''}` : ''} to hit your target
                      </Text>
                    </View>
                  )}

                  {isSinkingFund && !isPaymentDue && remaining <= 0 && (
                    <View className='mt-3 flex-row items-center gap-1.5'>
                      <Feather name='check-circle' size={12} color='#059669' />
                      <Text className='text-[12px] text-emerald-600 font-medium'>
                        Fully funded — ready to pay
                      </Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View className='flex-row gap-2 mt-4'>
                    {/* Mark as Paid — sinking fund only */}
                    {isPaymentDue ? (
                      <Pressable
                        onPress={() => handleMarkPaid(g)}
                        className='flex-1 flex-row items-center justify-center bg-red-500 rounded-xl py-2.5 gap-1.5'
                      >
                        <Feather name='check' size={14} color='#fff' />
                        <Text className='text-white text-[13px] font-semibold'>Mark as Paid</Text>
                      </Pressable>
                    ) : (
                      <>
                        {/* Add money */}
                        <Pressable
                          onPress={() => {
                            setContributionGoalId(g._id);
                            setContributionAmount('');
                          }}
                          className='flex-1 flex-row items-center justify-center bg-black rounded-xl py-2.5 gap-1.5'
                        >
                          <Feather name='plus' size={14} color='#fff' />
                          <Text className='text-white text-[13px] font-semibold'>Add money</Text>
                        </Pressable>

                        {/* Mark complete — only for non-sinking-fund goals */}
                        {!isSinkingFund && (
                          <Pressable
                            onPress={() => handleMarkComplete(g)}
                            className='flex-1 flex-row items-center justify-center rounded-xl py-2.5 gap-1.5'
                            style={{ backgroundColor: isComplete ? g.color + '20' : '#F5F5F5' }}
                          >
                            <Feather
                              name='check-circle'
                              size={14}
                              color={isComplete ? g.color : '#D4D4D4'}
                            />
                            <Text
                              className='text-[13px] font-semibold'
                              style={{ color: isComplete ? g.color : '#D4D4D4' }}
                            >
                              Complete
                            </Text>
                          </Pressable>
                        )}

                        {/* Mark as Paid early — sinking fund fully funded */}
                        {isSinkingFund && remaining <= 0 && (
                          <Pressable
                            onPress={() => handleMarkPaid(g)}
                            className='flex-1 flex-row items-center justify-center rounded-xl py-2.5 gap-1.5'
                            style={{ backgroundColor: g.color + '20' }}
                          >
                            <Feather name='check' size={14} color={g.color} />
                            <Text className='text-[13px] font-semibold' style={{ color: g.color }}>
                              Pay Now
                            </Text>
                          </Pressable>
                        )}
                      </>
                    )}

                    {/* History */}
                    <Pressable
                      onPress={() => setHistoryGoalId(g._id)}
                      className='w-10 h-10 items-center justify-center rounded-xl bg-neutral-100'
                    >
                      <Feather name='clock' size={14} color='#A3A3A3' />
                    </Pressable>

                    {/* Delete */}
                    <Pressable
                      onPress={() => handleDelete(g)}
                      className='w-10 h-10 items-center justify-center rounded-xl bg-neutral-100'
                    >
                      <Feather name='trash-2' size={14} color='#A3A3A3' />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Achieved Goals */}
        {completedGoals.length > 0 && (
          <View className='px-6 mt-6'>
            <Text className='text-[17px] font-bold text-black mb-3'>
              Achieved
            </Text>
            {completedGoals.map((g) => (
              <View
                key={g._id}
                className='bg-white rounded-2xl p-4 mb-3 flex-row items-center gap-3'
              >
                <View
                  className='w-11 h-11 rounded-2xl items-center justify-center'
                  style={{ backgroundColor: g.color + '20' }}
                >
                  <Feather name={g.icon as any} size={18} color={g.color} />
                </View>
                <View className='flex-1'>
                  <Text className='text-[14px] font-semibold text-black'>
                    {g.name}
                  </Text>
                  {g.completedAt ? (
                    <Text className='text-[12px] text-neutral-400 mt-0.5'>
                      Completed on {formatDateShort(g.completedAt)}
                    </Text>
                  ) : null}
                </View>
                <View className='flex-row items-center gap-1.5'>
                  <Text
                    className='text-[14px] font-bold'
                    style={{ color: g.color }}
                  >
                    {formatCurrencyCompact(g.saved, currency)}
                  </Text>
                  <Feather name='check-circle' size={15} color={g.color} />
                </View>
              </View>
            ))}
          </View>
        )}

        <View className='h-32' />
      </ScrollView>

      {/* History Modal */}
      <Modal
        visible={!!historyGoalId}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setHistoryGoalId(null)}
      >
        <View className='flex-1 bg-neutral-50'>
          <View className='px-6 pt-5 pb-4 flex-row justify-between items-center border-b border-neutral-100'>
            <Text className='text-[18px] font-bold text-black'>Contribution History</Text>
            <Pressable onPress={() => setHistoryGoalId(null)}>
              <Feather name='x' size={20} color='#000' />
            </Pressable>
          </View>

          {historyGoal && (
            <View className='flex-row items-center gap-3 px-6 py-4 border-b border-neutral-100'>
              <View
                className='w-10 h-10 rounded-2xl items-center justify-center'
                style={{ backgroundColor: historyGoal.color + '20' }}
              >
                <Feather name={historyGoal.icon as any} size={16} color={historyGoal.color} />
              </View>
              <View>
                <Text className='text-[15px] font-semibold text-black'>{historyGoal.name}</Text>
                <Text className='text-[12px] text-neutral-400'>
                  {formatCurrencyCompact(historyGoal.saved, currency)} saved of {formatCurrencyCompact(historyGoal.target, currency)}
                </Text>
              </View>
            </View>
          )}

          <ScrollView
            className='flex-1'
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {contributions === undefined ? (
              <View className='items-center py-12'>
                <Text className='text-neutral-400 text-[14px]'>Loading...</Text>
              </View>
            ) : contributions.length === 0 ? (
              <View className='items-center py-16'>
                <View className='w-14 h-14 rounded-full bg-neutral-100 items-center justify-center mb-3'>
                  <Feather name='clock' size={22} color='#A3A3A3' />
                </View>
                <Text className='text-[15px] font-semibold text-black'>No contributions yet</Text>
                <Text className='text-neutral-400 text-[13px] mt-1'>
                  Add money to this goal to see history
                </Text>
              </View>
            ) : (
              contributions.map((c, i) => (
                <View
                  key={c._id}
                  className={`flex-row items-center justify-between py-4 ${i < contributions.length - 1 ? 'border-b border-neutral-100' : ''}`}
                >
                  <View className='flex-row items-center gap-3'>
                    <View className='w-9 h-9 rounded-full bg-neutral-100 items-center justify-center'>
                      <Feather name='arrow-up' size={14} color='#000' />
                    </View>
                    <Text className='text-[14px] text-neutral-500'>
                      {formatDateShort(c.date)}
                    </Text>
                  </View>
                  <Text className='text-[15px] font-bold text-black'>
                    +{formatCurrencyCompact(c.amount, currency)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Add Contribution Modal */}
      <Modal
        visible={!!contributionGoalId}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setContributionGoalId(null)}
      >
        <View className='flex-1 bg-neutral-50'>
          <View className='px-6 pt-5 pb-4 flex-row justify-between items-center border-b border-neutral-100'>
            <Text className='text-[18px] font-bold text-black'>Add Money</Text>
            <Pressable onPress={() => setContributionGoalId(null)}>
              <Feather name='x' size={20} color='#000' />
            </Pressable>
          </View>

          {selectedGoal && (
            <View className='px-6 pt-6'>
              {/* Goal info */}
              <View className='flex-row items-center gap-3 mb-8'>
                <View
                  className='w-12 h-12 rounded-2xl items-center justify-center'
                  style={{ backgroundColor: selectedGoal.color + '20' }}
                >
                  <Feather
                    name={selectedGoal.icon as any}
                    size={20}
                    color={selectedGoal.color}
                  />
                </View>
                <View>
                  <Text className='text-[16px] font-semibold text-black'>
                    {selectedGoal.name}
                  </Text>
                  <Text className='text-[13px] text-neutral-400'>
                    {formatCurrencyCompact(selectedGoal.saved, currency)} saved
                    of {formatCurrencyCompact(selectedGoal.target, currency)}
                  </Text>
                </View>
              </View>

              {/* Amount input */}
              <Text className='text-[13px] text-neutral-500 mb-2 font-medium'>
                Amount to save
              </Text>
              <View className='bg-white rounded-2xl px-4 py-3 flex-row items-center gap-2 mb-6'>
                <Text className='text-[20px] text-neutral-300 font-medium'>
                  {currency}
                </Text>
                <TextInput
                  value={contributionAmount}
                  onChangeText={setContributionAmount}
                  placeholder='0'
                  placeholderTextColor='#D4D4D4'
                  keyboardType='numeric'
                  className='flex-1 text-[28px] font-bold text-black'
                  autoFocus
                />
              </View>

              <Pressable
                onPress={handleContribute}
                className='bg-black rounded-2xl py-4 items-center'
              >
                <Text className='text-white text-[15px] font-bold'>
                  Save to Goal
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
