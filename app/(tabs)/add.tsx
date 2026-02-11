import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useExpense, TransactionType } from '../../components/ExpenseContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function AddScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const { addTransaction } = useExpense();
  const router = useRouter();

  const handleSave = () => {
    if (!amount || !description) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    addTransaction(numAmount, description, type);
    
    // Reset
    setAmount('');
    setDescription('');
    router.replace('/');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-white p-5">
        <Text className="text-2xl font-bold text-black mb-8 text-center">New Transaction</Text>

        {/* Toggle Type */}
        <View className="flex-row border border-black rounded-lg overflow-hidden mb-8">
          <TouchableOpacity 
            className={`flex-1 py-3 items-center ${type === 'expense' ? 'bg-black' : 'bg-white'}`}
            onPress={() => setType('expense')}
          >
            <Text className={`font-semibold ${type === 'expense' ? 'text-white' : 'text-black'}`}>Expense</Text>
          </TouchableOpacity>
          <View className="w-[1px] bg-black" />
          <TouchableOpacity 
            className={`flex-1 py-3 items-center ${type === 'income' ? 'bg-black' : 'bg-white'}`}
            onPress={() => setType('income')}
          >
            <Text className={`font-semibold ${type === 'income' ? 'text-white' : 'text-black'}`}>Income</Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View className="mb-8">
           <Text className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Amount</Text>
           <View className="flex-row items-center border-b border-black pb-2">
             <Text className="text-3xl font-bold mr-2">$</Text>
             <TextInput
               className="flex-1 text-4xl font-bold text-black"
               placeholder="0.00"
               keyboardType="numeric"
               value={amount}
               onChangeText={setAmount}
               placeholderTextColor="#ccc"
             />
           </View>
        </View>

        {/* Description Input */}
        <View className="mb-10">
           <Text className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Description</Text>
           <TextInput
             className="text-lg border-b border-gray-200 pb-2 text-black"
             placeholder="What is this for?"
             value={description}
             onChangeText={setDescription}
             placeholderTextColor="#ccc"
           />
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          className="bg-black py-4 rounded-xl items-center shadow-lg active:bg-gray-900"
          onPress={handleSave}
        >
          <Text className="text-white font-bold text-lg">Save Transaction</Text>
        </TouchableOpacity>

      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
