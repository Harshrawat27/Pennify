import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable,
  TextInput, Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { formatCurrency } from '@/lib/utils/currency';
import {
  currentMonth, formatMonthLabel, prevMonth, nextMonth,
  isCurrentMonth, monthToDateRange, getLastNMonths,
} from '@/lib/utils/date';

export default function MonthDetailScreen() {
  const insets = useSafeAreaInsets();
  const { month: paramMonth } = useLocalSearchParams<{ month: string }>();
  const [month, setMonth] = useState(paramMonth ?? currentMonth());
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const { start, end } = useMemo(() => monthToDateRange(month), [month]);

  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');
  const stats = useQuery(
    api.transactions.getStatsForPeriod,
    userId ? { userId, startDate: start, endDate: end } : 'skip',
  );
  const transactions = useQuery(
    api.transactions.listByMonth,
    userId ? { userId, month } : 'skip',
  );

  const currency = prefs?.currency ?? 'INR';
  const trackIncome = prefs?.trackIncome ?? true;

  const filteredTx = useMemo(() => {
    const all = transactions ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (tx) =>
        tx.title.toLowerCase().includes(q) ||
        tx.categoryName?.toLowerCase().includes(q) ||
        tx.accountName?.toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const pickerMonths = useMemo(() => getLastNMonths(24), []);
  const isFuture = month > currentMonth();

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>

      {/* ── Header ── */}
      <View className="px-4 pt-4 pb-3 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
        >
          <Feather name="arrow-left" size={20} color="#000" />
        </Pressable>

        {/* Month navigator */}
        <Pressable
          onPress={() => setMonth(prevMonth(month))}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
        >
          <Feather name="chevron-left" size={20} color="#000" />
        </Pressable>

        <Pressable
          onPress={() => setShowPicker(true)}
          className="flex-1 h-10 bg-white rounded-full items-center justify-center flex-row gap-1.5"
        >
          <Text className="text-[14px] font-bold text-black">{formatMonthLabel(month)}</Text>
          <Feather name="chevron-down" size={14} color="#A3A3A3" />
        </Pressable>

        <Pressable
          onPress={() => !isFuture && setMonth(nextMonth(month))}
          className={`w-10 h-10 rounded-full items-center justify-center ${isFuture ? 'bg-neutral-100' : 'bg-white'}`}
        >
          <Feather name="chevron-right" size={20} color={isFuture ? '#D4D4D4' : '#000'} />
        </Pressable>
      </View>

      {/* ── Search bar ── */}
      <View className="mx-4 mb-3 bg-white rounded-2xl flex-row items-center px-4 gap-3">
        <Feather name="search" size={16} color="#A3A3A3" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search transactions..."
          placeholderTextColor="#D4D4D4"
          className="flex-1 py-3.5 text-[14px] text-black"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={16} color="#A3A3A3" />
          </Pressable>
        )}
      </View>

      {stats === undefined || transactions === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Stats cards ── */}
          {!search && (
            <View className="flex-row gap-3 mx-4 mb-4">
              {/* Expenses */}
              <View className="flex-1 bg-black rounded-2xl p-4">
                <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center mb-3">
                  <Feather name="arrow-down-right" size={16} color="#fff" />
                </View>
                <Text className="text-neutral-400 text-[11px]">Expenses</Text>
                <Text className="text-white text-[18px] font-bold mt-0.5" numberOfLines={1}>
                  {formatCurrency(stats.expenses, currency)}
                </Text>
              </View>

              {/* Income */}
              {trackIncome && (
                <View className="flex-1 bg-white rounded-2xl p-4">
                  <View className="w-9 h-9 rounded-xl bg-neutral-100 items-center justify-center mb-3">
                    <Feather name="arrow-up-right" size={16} color="#000" />
                  </View>
                  <Text className="text-neutral-400 text-[11px]">Income</Text>
                  <Text className="text-black text-[18px] font-bold mt-0.5" numberOfLines={1}>
                    {formatCurrency(stats.income, currency)}
                  </Text>
                </View>
              )}

              {/* Net */}
              {trackIncome && (
                <View className="flex-1 bg-white rounded-2xl p-4">
                  <View className="w-9 h-9 rounded-xl bg-neutral-100 items-center justify-center mb-3">
                    <Feather name="activity" size={16} color="#000" />
                  </View>
                  <Text className="text-neutral-400 text-[11px]">Net</Text>
                  <Text
                    className={`text-[18px] font-bold mt-0.5 ${stats.income - stats.expenses >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                    numberOfLines={1}
                  >
                    {stats.income - stats.expenses >= 0 ? '+' : ''}
                    {formatCurrency(stats.income - stats.expenses, currency)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Top categories (hidden during search) ── */}
          {!search && stats.categoryBreakdown.length > 0 && (
            <View className="mx-4 mb-4 bg-white rounded-2xl p-4">
              <Text className="text-[14px] font-bold text-black mb-3">Top Categories</Text>
              {stats.categoryBreakdown.slice(0, 4).map((cat, i) => (
                <View key={cat.name} className={`flex-row items-center gap-3 ${i > 0 ? 'mt-3' : ''}`}>
                  <View className="w-8 h-8 rounded-xl bg-neutral-100 items-center justify-center">
                    <Feather name={cat.icon as any} size={14} color="#000" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-[13px] font-medium text-black">{cat.name}</Text>
                      <Text className="text-[13px] font-bold text-black">
                        {formatCurrency(cat.amount, currency)}
                      </Text>
                    </View>
                    <View className="h-1 bg-neutral-100 rounded-full">
                      <View className="h-1 bg-black rounded-full" style={{ width: `${cat.percent}%` }} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Transactions ── */}
          <View className="mx-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[14px] font-bold text-black">
                {search ? `${filteredTx.length} result${filteredTx.length !== 1 ? 's' : ''}` : `${transactions.length} transactions`}
              </Text>
            </View>

            {filteredTx.length === 0 ? (
              <View className="bg-white rounded-2xl p-10 items-center">
                <Feather name={search ? 'search' : 'inbox'} size={28} color="#D4D4D4" />
                <Text className="text-neutral-400 text-[13px] mt-3">
                  {search ? 'No matching transactions' : 'No transactions this month'}
                </Text>
              </View>
            ) : (
              filteredTx.map((tx) => (
                <Pressable
                  key={tx._id}
                  onPress={() => router.push(`/transaction-detail?id=${tx._id}`)}
                  className="bg-white rounded-2xl p-4 mb-2.5"
                >
                  <View className="flex-row items-center">
                    <View className="w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center">
                      <Feather name={tx.categoryIcon as any} size={18} color="#000" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-black font-semibold text-[14px]">{tx.title}</Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <View className="flex-row items-center gap-1">
                          <Feather name="tag" size={10} color="#A3A3A3" />
                          <Text className="text-neutral-400 text-[11px]">{tx.categoryName}</Text>
                        </View>
                        {tx.accountName ? (
                          <View className="flex-row items-center gap-1">
                            <Feather name="credit-card" size={10} color="#A3A3A3" />
                            <Text className="text-neutral-400 text-[11px]">{tx.accountName}</Text>
                          </View>
                        ) : null}
                        <View className="flex-row items-center gap-1">
                          <Feather name="calendar" size={10} color="#A3A3A3" />
                          <Text className="text-neutral-400 text-[11px]">
                            {tx.date.split('-')[2]} {formatMonthLabel(month).split(' ')[0].slice(0, 3)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text
                      className={`font-bold text-[15px] ml-2 ${tx.amount > 0 ? 'text-emerald-600' : 'text-black'}`}
                    >
                      {tx.amount > 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(tx.amount), currency)}
                    </Text>
                  </View>
                  {tx.note ? (
                    <Text className="text-neutral-400 text-[12px] mt-2 ml-14">{tx.note}</Text>
                  ) : null}
                </Pressable>
              ))
            )}
          </View>

          <View className="h-12" />
        </ScrollView>
      )}

      {/* ── Month Picker Modal ── */}
      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
          <View className="px-6 pt-5 pb-4 flex-row justify-between items-center border-b border-neutral-100">
            <Text className="text-[18px] font-bold text-black">Select Month</Text>
            <Pressable onPress={() => setShowPicker(false)}>
              <Feather name="x" size={20} color="#000" />
            </Pressable>
          </View>
          <FlatList
            data={pickerMonths}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isSel = item === month;
              const isCur = isCurrentMonth(item);
              return (
                <Pressable
                  onPress={() => { setMonth(item); setShowPicker(false); }}
                  className={`flex-row items-center justify-between py-4 border-b border-neutral-100`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className={`w-2 h-2 rounded-full ${isSel ? 'bg-black' : 'bg-transparent'}`} />
                    <Text className={`text-[15px] ${isSel ? 'font-bold text-black' : 'font-medium text-neutral-600'}`}>
                      {formatMonthLabel(item)}
                    </Text>
                  </View>
                  {isCur && (
                    <View className="bg-neutral-100 px-2.5 py-1 rounded-full">
                      <Text className="text-[11px] font-medium text-neutral-500">Current</Text>
                    </View>
                  )}
                  {isSel && !isCur && (
                    <Feather name="check" size={16} color="#000" />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
