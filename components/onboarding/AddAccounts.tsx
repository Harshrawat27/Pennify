import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore, type OnboardingAccount } from '@/lib/stores/useOnboardingStore';
import type { FeatherIcon } from '@/lib/models/types';

const ACCOUNT_TYPES: { type: OnboardingAccount['type']; icon: FeatherIcon; label: string }[] = [
  { type: 'cash', icon: 'dollar-sign', label: 'Cash' },
  { type: 'bank', icon: 'home', label: 'Bank' },
  { type: 'credit', icon: 'credit-card', label: 'Credit Card' },
  { type: 'wallet', icon: 'smartphone', label: 'Digital Wallet' },
];

interface AddAccountsProps {
  onNext: () => void;
  onBack: () => void;
}

export function AddAccounts({ onNext, onBack }: AddAccountsProps) {
  const accounts = useOnboardingStore((s) => s.accounts);
  const setAccounts = useOnboardingStore((s) => s.setAccounts);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<OnboardingAccount['type']>('bank');

  const addAccount = () => {
    if (!newName.trim()) return;
    const typeInfo = ACCOUNT_TYPES.find((t) => t.type === newType)!;
    setAccounts([
      ...accounts,
      { name: newName.trim(), type: newType, icon: typeInfo.icon, balance: 0 },
    ]);
    setNewName('');
    setShowAdd(false);
  };

  const removeAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center mb-4">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[28px] font-bold text-black">
            Add your accounts
          </Text>
          <Text className="text-neutral-400 text-[15px] mt-2">
            Where do you keep your money? Add at least one account.
          </Text>
        </View>

        {/* Account list */}
        <View className="mx-6 gap-3">
          {accounts.map((acc, i) => (
            <View key={i} className="bg-white rounded-2xl p-4 flex-row items-center">
              <View className="w-11 h-11 rounded-xl bg-neutral-100 items-center justify-center">
                <Feather name={acc.icon} size={18} color="#000" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-[15px] font-semibold text-black">{acc.name}</Text>
                <Text className="text-[12px] text-neutral-400 mt-0.5 capitalize">{acc.type}</Text>
              </View>
              {accounts.length > 1 && (
                <Pressable onPress={() => removeAccount(i)} className="p-2">
                  <Feather name="x" size={16} color="#A3A3A3" />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Add new */}
        {showAdd ? (
          <View className="mx-6 mt-3 bg-white rounded-2xl p-5">
            <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Account Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. HDFC Bank, Paytm..."
              placeholderTextColor="#D4D4D4"
              className="text-[16px] text-black mb-4"
              autoFocus
            />

            <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Type</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ACCOUNT_TYPES.map((t) => (
                <Pressable
                  key={t.type}
                  onPress={() => setNewType(t.type)}
                  className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl ${
                    newType === t.type ? 'bg-black' : 'bg-neutral-100'
                  }`}
                >
                  <Feather name={t.icon} size={14} color={newType === t.type ? '#fff' : '#000'} />
                  <Text className={`text-[13px] font-medium ${newType === t.type ? 'text-white' : 'text-black'}`}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => { setShowAdd(false); setNewName(''); }}
                className="flex-1 py-3 rounded-xl items-center bg-neutral-100"
              >
                <Text className="text-[14px] font-semibold text-neutral-500">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={addAccount}
                className={`flex-1 py-3 rounded-xl items-center ${newName.trim() ? 'bg-black' : 'bg-neutral-300'}`}
                disabled={!newName.trim()}
              >
                <Text className="text-[14px] font-semibold text-white">Add</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowAdd(true)}
            className="mx-6 mt-3 bg-white rounded-2xl p-4 flex-row items-center justify-center gap-2"
          >
            <Feather name="plus" size={18} color="#A3A3A3" />
            <Text className="text-[14px] font-medium text-neutral-400">Add Account</Text>
          </Pressable>
        )}

        <View className="h-32" />
      </ScrollView>

      {/* Continue */}
      <View className="px-6 pb-10 pt-4 bg-neutral-50">
        <Pressable
          onPress={onNext}
          className={`py-4 rounded-2xl items-center ${accounts.length > 0 ? 'bg-black' : 'bg-neutral-300'}`}
          disabled={accounts.length === 0}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
