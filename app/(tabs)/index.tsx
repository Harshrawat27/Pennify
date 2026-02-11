import { View, Text, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpense } from '../../components/ExpenseContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { balance, transactions } = useExpense();
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-5 pt-4">
      {/* Header */}
      <View className="mb-8 flex-row justify-between items-center">
        <Text className="text-3xl font-serif font-bold text-black tracking-tight">Pennify</Text>
        <TouchableOpacity className="border border-gray-200 p-2 rounded-full">
           <Feather name="bell" size={20} color="black" />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View className="border border-black rounded-xl p-6 mb-8">
        <Text className="text-gray-500 font-medium text-sm mb-2 uppercase tracking-wider">Total Balance</Text>
        <Text className="text-4xl font-bold text-black">{formatCurrency(balance)}</Text>
        
        <View className="flex-row mt-6 space-x-4">
           <View className="flex-1 flex-row items-center">
              <View className="bg-black/5 p-1 rounded mr-2">
                 <Feather name="arrow-down-left" size={16} color="black" />
              </View>
              <View>
                 <Text className="text-xs text-gray-400">Income</Text>
                 <Text className="font-semibold text-sm">
                    {formatCurrency(transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0))}
                 </Text>
              </View>
           </View>
           <View className="w-[1px] h-8 bg-gray-100 mx-4" />
           <View className="flex-1 flex-row items-center">
              <View className="bg-black/5 p-1 rounded mr-2">
                 <Feather name="arrow-up-right" size={16} color="black" />
              </View>
              <View>
                 <Text className="text-xs text-gray-400">Expenses</Text>
                 <Text className="font-semibold text-sm">
                    {formatCurrency(transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0))}
                 </Text>
              </View>
           </View>
        </View>
      </View>

      {/* Recent Activity Header */}
      <View className="flex-row justify-between items-end mb-4">
        <Text className="text-xl font-bold text-black">Activity</Text>
        <Text className="text-gray-400 text-sm">See all</Text>
      </View>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <View className="flex-1 justify-center items-center py-20 opacity-50">
          <Feather name="inbox" size={40} color="gray" />
          <Text className="text-gray-400 mt-4 text-center">No transactions yet.{'\n'}Add one to get started.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {transactions.map((item) => (
            <View key={item.id} className="flex-row items-center justify-between py-4 border-b border-gray-100">
              <View className="flex-row items-center flex-1">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${item.type === 'income' ? 'bg-black' : 'border border-gray-200 bg-white'}`}>
                  <Feather 
                    name={item.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'} 
                    size={20} 
                    color={item.type === 'income' ? 'white' : 'black'} 
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-black text-base">{item.description}</Text>
                  <Text className="text-gray-400 text-xs">{formatDate(item.date)}</Text>
                </View>
              </View>
              <Text className={`font-bold text-base ${item.type === 'income' ? 'text-black' : 'text-black'}`}>
                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
