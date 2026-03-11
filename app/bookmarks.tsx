import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { formatCurrency } from '@/lib/utils/currency';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native';

export default function BookmarksScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const bookmarks = useQuery(api.transactions.listBookmarked, userId ? { userId } : 'skip');
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');
  const currency = prefs?.currency ?? 'INR';

  // Group by date descending
  const grouped = (bookmarks ?? [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .reduce((acc: Record<string, typeof bookmarks>, tx) => {
      if (!acc) return acc;
      if (!acc[tx!.date]) acc[tx!.date] = [];
      acc[tx!.date]!.push(tx!);
      return acc;
    }, {} as Record<string, typeof bookmarks>);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <View className='flex-1 bg-neutral-50'>
      {/* Header */}
      <View className='px-6 pt-4 pb-4 flex-row items-center gap-4'>
        <Pressable
          onPress={() => router.back()}
          className='w-10 h-10 rounded-full bg-white items-center justify-center'
        >
          <Feather name='arrow-left' size={20} color='#000' />
        </Pressable>
        <Text className='text-[20px] font-bold text-black flex-1'>Bookmarks</Text>
        <Feather name='bookmark' size={20} color='#000' />
      </View>

      {bookmarks === undefined ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#000' />
        </View>
      ) : bookmarks.length === 0 ? (
        <View className='flex-1 items-center justify-center px-8'>
          <View className='w-16 h-16 rounded-full bg-neutral-100 items-center justify-center mb-4'>
            <Feather name='bookmark' size={28} color='#D4D4D4' />
          </View>
          <Text className='text-[16px] font-semibold text-black text-center'>No bookmarks yet</Text>
          <Text className='text-[13px] text-neutral-400 text-center mt-2'>
            Tap the bookmark icon when adding or editing a transaction to save it here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        >
          {Object.entries(grouped).map(([date, txs]) => (
            <View key={date} className='mt-5'>
              <Text className='text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3'>
                {formatDate(date)}
              </Text>
              {(txs ?? []).map((tx, i) => (
                <Pressable
                  key={tx!._id}
                  onPress={() => router.push(`/transaction-detail?id=${tx!._id}`)}
                  className={`bg-white rounded-2xl p-4 ${i < (txs ?? []).length - 1 ? 'mb-3' : ''}`}
                >
                  <View className='flex-row items-center'>
                    <View className='w-12 h-12 rounded-2xl bg-neutral-100 items-center justify-center'>
                      <Feather name={tx!.categoryIcon as any} size={19} color='#000' />
                    </View>
                    <View className='flex-1 ml-3.5'>
                      <Text className='text-black font-bold text-[15px]'>{tx!.title}</Text>
                      <View className='flex-row items-center mt-1.5 gap-2.5'>
                        <View
                          className='px-2 py-0.5 rounded-full'
                          style={{ backgroundColor: `${tx!.categoryColor}18` }}
                        >
                          <Text className='text-[10px] font-medium' style={{ color: tx!.categoryColor }}>
                            {tx!.categoryName}
                          </Text>
                        </View>
                        {tx!.accountName ? (
                          <View className='flex-row items-center gap-1'>
                            <Feather name='credit-card' size={10} color='#A3A3A3' />
                            <Text className='text-neutral-400 text-[11px]'>{tx!.accountName}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <Text
                      className={`font-bold text-[15px] ${tx!.amount > 0 ? 'text-emerald-600' : 'text-black'}`}
                    >
                      {tx!.amount > 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(tx!.amount), currency)}
                    </Text>
                  </View>
                  {tx!.note ? (
                    <Text className='text-neutral-400 text-[12px] mt-2 ml-[62px]'>{tx!.note}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
