import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCOUNT_TYPES: { type: string; icon: string; label: string }[] = [
  { type: 'cash',   icon: 'dollar-sign',  label: 'Cash' },
  { type: 'bank',   icon: 'home',         label: 'Bank' },
  { type: 'credit', icon: 'credit-card',  label: 'Credit Card' },
  { type: 'wallet', icon: 'smartphone',   label: 'Digital Wallet' },
];

const TYPE_LABEL: Record<string, string> = {
  bank: 'Bank Account',
  cash: 'Cash',
  credit: 'Credit Card',
  savings: 'Savings',
  investment: 'Investment',
  wallet: 'Digital Wallet',
};

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const accounts = useQuery(api.accounts.list, userId ? { userId } : 'skip');
  const toggleActive = useMutation(api.accounts.toggleActive);
  const createAccount = useMutation(api.accounts.create);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('bank');
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (id: string, currentIsActive: boolean | undefined) => {
    const nextValue = currentIsActive === false ? true : false;
    void toggleActive({ id: id as any, isActive: nextValue });
  };

  const handleAdd = async () => {
    if (!userId || !newName.trim() || isSaving) return;
    const typeInfo = ACCOUNT_TYPES.find((t) => t.type === newType)!;
    setIsSaving(true);
    try {
      await createAccount({ userId, name: newName.trim(), type: newType, icon: typeInfo.icon });
      setNewName('');
      setNewType('bank');
      setShowAdd(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-neutral-50'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className='px-6 pt-4 pb-4 flex-row items-center justify-between'>
        <View className='flex-row items-center gap-4'>
          <Pressable
            onPress={() => router.back()}
            className='w-10 h-10 rounded-full bg-white items-center justify-center'
          >
            <Feather name='arrow-left' size={20} color='#000' />
          </Pressable>
          <Text className='text-[20px] font-bold text-black'>Accounts</Text>
        </View>
        <Pressable
          onPress={() => { setShowAdd(true); setNewName(''); setNewType('bank'); }}
          className='w-10 h-10 rounded-full bg-white items-center justify-center'
        >
          <Feather name='plus' size={20} color='#000' />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
        {/* Info banner */}
        <View className='mx-6 mb-4 bg-neutral-100 rounded-2xl px-4 py-3 flex-row items-start gap-3'>
          <Feather name='info' size={14} color='#A3A3A3' style={{ marginTop: 1 }} />
          <Text className='flex-1 text-[12px] text-neutral-400 leading-5'>
            Inactive accounts won't appear when adding transactions but all past transactions remain unchanged.
          </Text>
        </View>

        {/* Accounts list */}
        <View className='mx-6 bg-white rounded-2xl px-4'>
          {accounts === undefined ? (
            <View className='py-8 items-center'>
              <Text className='text-neutral-400 text-[14px]'>Loading...</Text>
            </View>
          ) : accounts.length === 0 ? (
            <View className='py-10 items-center'>
              <Feather name='credit-card' size={28} color='#D4D4D4' />
              <Text className='text-neutral-400 text-[14px] mt-3'>No accounts yet</Text>
            </View>
          ) : (
            accounts.map((account, i) => {
              const isActive = account.isActive !== false;
              const typeLabel = TYPE_LABEL[account.type] ?? account.type;
              return (
                <View
                  key={account._id}
                  className={`flex-row items-center py-4 ${i < accounts.length - 1 ? 'border-b border-neutral-100' : ''}`}
                >
                  <View
                    className='w-10 h-10 rounded-xl items-center justify-center'
                    style={{ backgroundColor: isActive ? '#F5F5F5' : '#FAFAFA' }}
                  >
                    <Feather
                      name={account.icon as any}
                      size={17}
                      color={isActive ? '#000' : '#D4D4D4'}
                    />
                  </View>
                  <View className='flex-1 ml-3'>
                    <Text
                      className='text-[14px] font-semibold'
                      style={{ color: isActive ? '#000' : '#A3A3A3' }}
                    >
                      {account.name}
                    </Text>
                    <Text className='text-[12px] text-neutral-400 mt-0.5'>{typeLabel}</Text>
                  </View>
                  <View className='flex-row items-center gap-3'>
                    {!isActive && (
                      <View className='bg-neutral-100 px-2.5 py-1 rounded-full'>
                        <Text className='text-[11px] text-neutral-400 font-medium'>Inactive</Text>
                      </View>
                    )}
                    <Switch
                      value={isActive}
                      onValueChange={() => handleToggle(account._id, account.isActive)}
                      trackColor={{ false: '#E5E5E5', true: '#000000' }}
                      thumbColor='#FFFFFF'
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Inline Add form */}
        {showAdd && (
          <View className='mx-6 mt-4 bg-white rounded-2xl p-5'>
            <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>
              Account Name
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder='e.g. HDFC Bank, Paytm...'
              placeholderTextColor='#D4D4D4'
              className='text-[16px] text-black mb-5'
              autoFocus
              returnKeyType='done'
            />

            <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>
              Type
            </Text>
            <View className='flex-row flex-wrap gap-2 mb-5'>
              {ACCOUNT_TYPES.map((t) => (
                <Pressable
                  key={t.type}
                  onPress={() => setNewType(t.type)}
                  className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl ${
                    newType === t.type ? 'bg-black' : 'bg-neutral-100'
                  }`}
                >
                  <Feather
                    name={t.icon as any}
                    size={14}
                    color={newType === t.type ? '#fff' : '#000'}
                  />
                  <Text
                    className={`text-[13px] font-medium ${
                      newType === t.type ? 'text-white' : 'text-black'
                    }`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className='flex-row gap-3'>
              <Pressable
                onPress={() => { setShowAdd(false); setNewName(''); }}
                className='flex-1 py-3 rounded-xl items-center bg-neutral-100'
              >
                <Text className='text-[14px] font-semibold text-neutral-500'>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                disabled={!newName.trim() || isSaving}
                className={`flex-1 py-3 rounded-xl items-center ${newName.trim() && !isSaving ? 'bg-black' : 'bg-neutral-300'}`}
              >
                <Text className='text-[14px] font-semibold text-white'>
                  {isSaving ? 'Adding...' : 'Add'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Add button shortcut when form is hidden */}
        {!showAdd && (
          <Pressable
            onPress={() => { setShowAdd(true); setNewName(''); setNewType('bank'); }}
            className='mx-6 mt-4 bg-white rounded-2xl p-4 flex-row items-center justify-center gap-2'
          >
            <Feather name='plus' size={16} color='#A3A3A3' />
            <Text className='text-[14px] font-medium text-neutral-400'>Add Account</Text>
          </Pressable>
        )}

        <View className='h-16' />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
