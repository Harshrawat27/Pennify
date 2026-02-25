import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { formatCurrencyCompact } from '@/lib/utils/currency';
import { formatDateShort } from '@/lib/utils/date';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const goals = useQuery(api.goals.list, userId ? { userId } : 'skip');
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');

  const addContribution = useMutation(api.goals.addContribution);
  const markCompleted = useMutation(api.goals.markCompleted);
  const removeGoal = useMutation(api.goals.remove);

  const currency = prefs?.currency ?? 'INR';

  const activeGoals = (goals ?? []).filter((g) => g.status !== 'completed');
  const completedGoals = (goals ?? []).filter((g) => g.status === 'completed');
  const selectedGoal = goals?.find((g) => g._id === contributionGoalId);

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
        contentContainerStyle={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className='px-6 pt-4 pb-2 flex-row justify-between items-center'>
          <Text className='text-[22px] font-bold text-black tracking-tight'>
            Goals
          </Text>
          <Pressable
            onPress={() => router.push('/add-goal')}
            className='w-10 h-10 rounded-full bg-white items-center justify-center'
          >
            <Feather name='plus' size={18} color='#000' />
          </Pressable>
        </View>

        {/* Active Goals */}
        <View className='px-6 mt-4'>
          {activeGoals.length === 0 && completedGoals.length === 0 ? (
            <View className='bg-white rounded-2xl p-10 items-center mt-4'>
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

              return (
                <View key={g._id} className='bg-white rounded-2xl p-5 mb-3'>
                  {/* Goal info row */}
                  <View className='flex-row items-center gap-3'>
                    <View
                      className='w-12 h-12 rounded-2xl items-center justify-center'
                      style={{ backgroundColor: g.color + '20' }}
                    >
                      <Feather name={g.icon as any} size={20} color={g.color} />
                    </View>
                    <View className='flex-1'>
                      <Text className='text-[15px] font-semibold text-black'>
                        {g.name}
                      </Text>
                      <Text className='text-[12px] text-neutral-400 mt-0.5'>
                        {pct}% complete
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
                        backgroundColor: g.color,
                      }}
                    />
                  </View>

                  {/* Action buttons */}
                  <View className='flex-row gap-2 mt-4'>
                    {/* Add money */}
                    <Pressable
                      onPress={() => {
                        setContributionGoalId(g._id);
                        setContributionAmount('');
                      }}
                      className='flex-1 flex-row items-center justify-center bg-black rounded-xl py-2.5 gap-1.5'
                    >
                      <Feather name='plus' size={14} color='#fff' />
                      <Text className='text-white text-[13px] font-semibold'>
                        Add money
                      </Text>
                    </Pressable>

                    {/* Mark complete — faded until 100% */}
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

      {/* Add Contribution Modal */}
      <Modal
        visible={!!contributionGoalId}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setContributionGoalId(null)}
      >
        <View className='flex-1 bg-neutral-50' style={{ paddingTop: insets.top }}>
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
