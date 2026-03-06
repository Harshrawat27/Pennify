import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/currency';
import { prevMonth } from '@/lib/utils/date';

const PERIOD_TABS = ['Week', 'Month', 'Year'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4'];
const MONTH_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const RING_SIZE = 160;
const RING_STROKE = 14;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

// Group daily data into 4 weekly buckets
function groupByWeek(daily: { day: string; amount: number }[]) {
  const weeks = [0, 0, 0, 0];
  for (const d of daily) {
    const day = parseInt(d.day.split('-')[2]);
    const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
    weeks[idx] += d.amount;
  }
  return WEEK_LABELS.map((label, i) => ({ label, amount: weeks[i] }));
}

// Get current week Mon–Sun date strings
function getCurrentWeekRange() {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  return { start: fmt(monday), end: fmt(sunday) };
}

export default function ReportScreen() {
  const [period, setPeriod] = useState(1); // 0=Week 1=Month 2=Year
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentYear = today.getFullYear().toString();
  const currentMonthIdx = today.getMonth(); // 0-based
  const { start: weekStart, end: weekEnd } = getCurrentWeekRange();

  // ── Queries (all unconditional — hooks rules) ──
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');

  // Month
  const monthlyStats = useQuery(api.transactions.getMonthlyStats, userId ? { userId, month: currentMonth } : 'skip');
  const categoryBreakdown = useQuery(api.transactions.getCategoryBreakdown, userId ? { userId, month: currentMonth } : 'skip');
  const dailySpending = useQuery(api.transactions.getDailySpending, userId ? { userId, month: currentMonth } : 'skip');
  const monthlyBudget = useQuery(api.monthlyBudgets.getByMonth, userId ? { userId, month: currentMonth } : 'skip');
  const prevMonthBudget = useQuery(api.monthlyBudgets.getByMonth, userId ? { userId, month: prevMonth(currentMonth) } : 'skip');

  // Week
  const weekStats = useQuery(api.transactions.getStatsForPeriod, userId ? { userId, startDate: weekStart, endDate: weekEnd } : 'skip');

  // Year
  const yearlyMonthly = useQuery(api.transactions.getYearlyMonthly, userId ? { userId, year: currentYear } : 'skip');

  const currency = prefs?.currency ?? 'INR';
  const trackIncome = prefs?.trackIncome ?? true;

  // ── Month derived data ──
  const monthIncome = monthlyStats?.income ?? 0;
  const monthExpenses = monthlyStats?.expenses ?? 0;
  const budget = monthlyBudget?.budget ?? prevMonthBudget?.budget ?? 0;
  const spentPercent = budget > 0 ? Math.round((monthExpenses / budget) * 100) : 0;
  const leftAmount = Math.max(budget - monthExpenses, 0);
  const weeklyBars = groupByWeek(dailySpending ?? []);

  // ── Week derived data ──
  const weekExpenses = weekStats?.expenses ?? 0;
  const weekIncome = weekStats?.income ?? 0;
  const weekDaily = (weekStats?.dailyBreakdown ?? []).map((d) => ({
    label: DAY_LABELS[new Date(d.date + 'T00:00:00').getDay()],
    amount: d.amount,
  }));
  // Pad to 7 days (Mon–Sun)
  const allWeekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => ({
    label,
    amount: weekDaily.find((d) => d.label === label)?.amount ?? 0,
  }));
  const weekCats = weekStats?.categoryBreakdown ?? [];

  // ── Year derived data ──
  const yearData = yearlyMonthly ?? [];
  const yearExpenses = yearData.reduce((s, m) => s + m.expenses, 0);
  const yearIncome = yearData.reduce((s, m) => s + m.income, 0);

  // ── Shared bar chart component ──
  const renderBars = (
    bars: { label: string; amount: number }[],
    highlightIdx?: number,
  ) => {
    const max = bars.reduce((m, b) => Math.max(m, b.amount), 0);
    return (
      <View className="flex-row items-end justify-between" style={{ height: 110 }}>
        {bars.map((b, i) => {
          const barH = max > 0 ? Math.max((b.amount / max) * 90, b.amount > 0 ? 4 : 2) : 2;
          const isHighlight = highlightIdx !== undefined ? i === highlightIdx : b.amount === max && max > 0;
          return (
            <View key={`${b.label}-${i}`} className="items-center flex-1">
              {b.amount > 0 ? (
                <Text className="text-[9px] text-neutral-400 mb-1.5" numberOfLines={1}>
                  {b.amount >= 1000
                    ? `${getCurrencySymbol(currency)}${(b.amount / 1000).toFixed(0)}k`
                    : `${getCurrencySymbol(currency)}${b.amount}`}
                </Text>
              ) : (
                <Text className="text-[9px] text-transparent mb-1.5">-</Text>
              )}
              <View
                className={`rounded-full ${isHighlight ? 'bg-black' : 'bg-neutral-200'}`}
                style={{ height: barH, width: bars.length > 8 ? 16 : 22 }}
              />
              <Text className="text-[10px] text-neutral-400 mt-1.5">{b.label}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // ── Category list ──
  const renderCategories = (cats: { name: string; icon: string; amount: number; percent: number }[]) => (
    <>
      {cats.length === 0 ? (
        <View className="py-4 items-center">
          <Text className="text-neutral-400 text-[13px]">No spending data</Text>
        </View>
      ) : (
        cats.map((cat, i) => (
          <View key={cat.name} className={i > 0 ? 'mt-4' : ''}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-neutral-100 items-center justify-center">
                  <Feather name={cat.icon as any} size={16} color="#000" />
                </View>
                <Text className="text-[14px] font-medium text-black">{cat.name}</Text>
              </View>
              <Text className="text-[14px] font-bold text-black">
                {formatCurrency(cat.amount, currency)}
              </Text>
            </View>
            <View className="h-1.5 bg-neutral-100 rounded-full">
              <View className="h-1.5 bg-black rounded-full" style={{ width: `${cat.percent}%` }} />
            </View>
          </View>
        ))
      )}
    </>
  );

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerStyle={{}}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-[22px] font-bold text-black tracking-tight">Report</Text>
        <Pressable className="w-10 h-10 rounded-full bg-white items-center justify-center">
          <Feather name="download" size={18} color="#000" />
        </Pressable>
      </View>

      {/* Period Tabs */}
      <View className="flex-row mx-6 mt-3 bg-white rounded-xl p-1">
        {PERIOD_TABS.map((tab, i) => (
          <Pressable
            key={tab}
            onPress={() => setPeriod(i)}
            className={`flex-1 py-2.5 rounded-lg items-center ${period === i ? 'bg-black' : ''}`}
          >
            <Text className={`text-[13px] font-semibold ${period === i ? 'text-white' : 'text-neutral-400'}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ═══════════════ WEEK VIEW ═══════════════ */}
      {period === 0 && (
        <>
          {/* Summary */}
          <View className="mx-6 mt-6 bg-black rounded-2xl p-5">
            <Text className="text-neutral-500 text-[12px] uppercase tracking-wider mb-3">This Week</Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-neutral-500 text-[12px]">Spent</Text>
                <Text className="text-white text-[22px] font-bold mt-0.5">
                  {formatCurrency(weekExpenses, currency)}
                </Text>
              </View>
              {trackIncome && (
                <View className="items-end">
                  <Text className="text-neutral-500 text-[12px]">Income</Text>
                  <Text className="text-emerald-400 text-[22px] font-bold mt-0.5">
                    {formatCurrency(weekIncome, currency)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Daily bar chart */}
          <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
            <Text className="text-[15px] font-bold text-black mb-5">Daily Spending</Text>
            {renderBars(allWeekDays)}
          </View>

          {/* Category breakdown */}
          <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
            <Text className="text-[15px] font-bold text-black mb-4">By Category</Text>
            {renderCategories(weekCats)}
          </View>
        </>
      )}

      {/* ═══════════════ MONTH VIEW ═══════════════ */}
      {period === 1 && (
        <>
          {/* Budget Ring */}
          <View className="items-center mt-8">
            <View style={{ width: RING_SIZE, height: RING_SIZE }}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke="#F0F0F0" strokeWidth={RING_STROKE} fill="none" />
                <Circle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                  stroke={spentPercent > 90 ? '#EF4444' : '#000000'}
                  strokeWidth={RING_STROKE} fill="none"
                  strokeDasharray={`${RING_CIRC * (Math.min(spentPercent, 100) / 100)} ${RING_CIRC}`}
                  strokeLinecap="round" rotation="-90"
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>
              <View className="absolute inset-0 items-center justify-center">
                <Text className={`text-[28px] font-bold ${spentPercent > 90 ? 'text-red-500' : 'text-black'}`}>
                  {spentPercent}%
                </Text>
                <Text className="text-[11px] text-neutral-400">of budget</Text>
              </View>
            </View>
            <View className="flex-row gap-6 mt-5">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-black" />
                <Text className="text-[12px] text-neutral-500">Spent {formatCurrency(monthExpenses, currency)}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-neutral-200" />
                <Text className="text-[12px] text-neutral-500">Left {formatCurrency(leftAmount, currency)}</Text>
              </View>
            </View>
          </View>

          {/* Income vs Expense */}
          {trackIncome && (
            <View className="mx-6 mt-6 bg-white rounded-2xl p-5">
              <Text className="text-[15px] font-bold text-black mb-4">Income vs Expenses</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <Text className="text-[12px] text-neutral-400">Income</Text>
                  </View>
                  <Text className="text-[20px] font-bold text-black">{formatCurrency(monthIncome, currency)}</Text>
                  <View className="h-1.5 bg-neutral-100 rounded-full mt-2">
                    <View className="h-1.5 bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                  </View>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <View className="w-2.5 h-2.5 rounded-full bg-black" />
                    <Text className="text-[12px] text-neutral-400">Expenses</Text>
                  </View>
                  <Text className="text-[20px] font-bold text-black">{formatCurrency(monthExpenses, currency)}</Text>
                  <View className="h-1.5 bg-neutral-100 rounded-full mt-2">
                    <View
                      className="h-1.5 bg-black rounded-full"
                      style={{ width: `${monthIncome > 0 ? Math.min(Math.round((monthExpenses / monthIncome) * 100), 100) : 0}%` }}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Weekly bar chart */}
          <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
            <Text className="text-[15px] font-bold text-black mb-5">Weekly Spending</Text>
            {renderBars(weeklyBars)}
          </View>

          {/* Category breakdown */}
          <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
            <Text className="text-[15px] font-bold text-black mb-4">By Category</Text>
            {renderCategories(categoryBreakdown ?? [])}
          </View>
        </>
      )}

      {/* ═══════════════ YEAR VIEW ═══════════════ */}
      {period === 2 && (
        <>
          {/* Summary */}
          <View className="mx-6 mt-6 bg-black rounded-2xl p-5">
            <Text className="text-neutral-500 text-[12px] uppercase tracking-wider mb-3">{currentYear} Overview</Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-neutral-500 text-[12px]">Total Spent</Text>
                <Text className="text-white text-[22px] font-bold mt-0.5">
                  {formatCurrency(yearExpenses, currency)}
                </Text>
              </View>
              {trackIncome && (
                <View className="items-end">
                  <Text className="text-neutral-500 text-[12px]">Total Income</Text>
                  <Text className="text-emerald-400 text-[22px] font-bold mt-0.5">
                    {formatCurrency(yearIncome, currency)}
                  </Text>
                </View>
              )}
            </View>
            {trackIncome && yearIncome > 0 && (
              <View className="mt-4">
                <View className="h-1.5 bg-white/10 rounded-full">
                  <View
                    className={`h-1.5 rounded-full ${yearExpenses > yearIncome ? 'bg-red-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(Math.round((yearExpenses / yearIncome) * 100), 100)}%` }}
                  />
                </View>
                <Text className="text-neutral-500 text-[11px] mt-2">
                  {yearExpenses > yearIncome
                    ? `Overspent by ${formatCurrency(yearExpenses - yearIncome, currency)}`
                    : `Saved ${formatCurrency(yearIncome - yearExpenses, currency)} this year`}
                </Text>
              </View>
            )}
          </View>

          {/* 12-month bar chart */}
          <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
            <Text className="text-[15px] font-bold text-black mb-5">Monthly Spending</Text>
            {renderBars(
              yearData.map((m, i) => ({ label: MONTH_SHORT[i], amount: m.expenses })),
              currentMonthIdx,
            )}
            <View className="flex-row items-center gap-4 mt-4">
              <View className="flex-row items-center gap-1.5">
                <View className="w-3 h-3 rounded-full bg-black" />
                <Text className="text-[11px] text-neutral-400">Current month</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-3 h-3 rounded-full bg-neutral-200" />
                <Text className="text-[11px] text-neutral-400">Other months</Text>
              </View>
            </View>
          </View>

          {/* Highest spending month */}
          {yearData.length > 0 && (() => {
            const highest = yearData.reduce((max, m) => m.expenses > max.expenses ? m : max, yearData[0]);
            return highest.expenses > 0 ? (
              <View className="mx-6 mt-4 bg-white rounded-2xl p-5 flex-row items-center gap-4">
                <View className="w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center">
                  <Feather name="trending-up" size={18} color="#000" />
                </View>
                <View>
                  <Text className="text-[13px] text-neutral-400">Highest spending month</Text>
                  <Text className="text-[15px] font-bold text-black mt-0.5">
                    {highest.label} — {formatCurrency(highest.expenses, currency)}
                  </Text>
                </View>
              </View>
            ) : null;
          })()}
        </>
      )}

      <View className="h-32" />
    </ScrollView>
  );
}
