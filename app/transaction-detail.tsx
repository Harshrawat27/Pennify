import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { getCurrencySymbol } from '@/lib/utils/currency';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';

  const tx = useQuery(
    api.transactions.getById,
    id ? { id: id as any } : 'skip',
  );
  const categories = useQuery(api.categories.list, userId ? { userId } : 'skip');
  const accounts = useQuery(api.accounts.list, userId ? { userId, activeOnly: true } : 'skip');
  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');

  const updateTransaction = useMutation(api.transactions.update);
  const removeTransaction = useMutation(api.transactions.remove);
  const toggleBookmark = useMutation(api.transactions.toggleBookmark);

  const currency = prefs?.currency ?? 'INR';
  const trackIncome = prefs?.trackIncome ?? true;

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isExpense, setIsExpense] = useState(true);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Populate form once the transaction loads
  useEffect(() => {
    if (tx && !initialized) {
      setTitle(tx.title);
      setAmount(String(Math.abs(tx.amount)));
      setIsExpense(tx.amount < 0);
      setNote(tx.note ?? '');
      setDate(tx.date);
      if (tx.categoryId) setSelectedCategoryId(tx.categoryId as string);
      if (tx.accountId) setSelectedAccountId(tx.accountId as string);
      setInitialized(true);
    }
  }, [tx, initialized]);

  const filteredCategories = (categories ?? []).filter((c) =>
    isExpense ? c.type === 'expense' : c.type === 'income',
  );

  const effectiveCategoryId =
    selectedCategoryId && filteredCategories.find((c) => c._id === selectedCategoryId)
      ? selectedCategoryId
      : filteredCategories[0]?._id ?? '';

  const effectiveAccountId =
    selectedAccountId && (accounts ?? []).find((a) => a._id === selectedAccountId)
      ? selectedAccountId
      : (accounts ?? [])[0]?._id ?? '';

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0 || !effectiveCategoryId || !effectiveAccountId || !date) return;

    setIsSaving(true);
    try {
      await updateTransaction({
        id: id as any,
        title: title.trim(),
        amount: isExpense ? -numAmount : numAmount,
        note: note.trim(),
        date,
        categoryId: effectiveCategoryId as any,
        accountId: effectiveAccountId as any,
      });
      router.back();
    } catch (e) {
      console.error('[TransactionDetail] update failed:', e);
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTransaction({ id: id as any });
              router.back();
            } catch (e) {
              console.error('[TransactionDetail] delete failed:', e);
            }
          },
        },
      ],
    );
  };

  if (tx === undefined) {
    return (
      <View className='flex-1 bg-neutral-50 items-center justify-center'>
        <ActivityIndicator size='large' color='#000' />
      </View>
    );
  }

  if (tx === null) {
    return (
      <View className='flex-1 bg-neutral-50 items-center justify-center'>
        <Text className='text-neutral-400 text-[15px]'>Transaction not found.</Text>
        <Pressable onPress={() => router.back()} className='mt-4'>
          <Text className='text-black font-semibold'>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const canSave = title.trim() && amount && !isSaving && effectiveCategoryId && effectiveAccountId;

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-neutral-50'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Header */}
        <View className='px-6 pt-4 pb-2 flex-row justify-between items-center'>
          <Pressable
            onPress={() => router.back()}
            className='w-10 h-10 rounded-full bg-white items-center justify-center'
          >
            <Feather name='arrow-left' size={20} color='#000' />
          </Pressable>
          <Text className='text-[18px] font-bold text-black'>Transaction</Text>
          <View className='flex-row items-center gap-2'>
            <Pressable
              onPress={() => void toggleBookmark({ id: id as any })}
              className='w-10 h-10 rounded-full bg-white items-center justify-center'
            >
              <Feather name='bookmark' size={18} color={tx?.isBookmarked ? '#000' : '#A3A3A3'} />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              className='w-10 h-10 rounded-full bg-red-50 items-center justify-center'
            >
              <Feather name='trash-2' size={18} color='#EF4444' />
            </Pressable>
          </View>
        </View>

        {/* Receipt thumbnail — only shown if transaction was scanned */}
        {tx.receiptUrl ? (
          <Pressable
            onPress={() => setReceiptVisible(true)}
            className='mx-6 mt-4 bg-white rounded-2xl p-3 flex-row items-center gap-3'
          >
            <Image
              source={{ uri: tx.receiptUrl }}
              style={{ width: 52, height: 72, borderRadius: 8 }}
              contentFit='cover'
            />
            <View className='flex-1'>
              <Text className='text-[13px] font-semibold text-black'>Receipt</Text>
              <Text className='text-[11px] text-neutral-400 mt-0.5'>Tap to view full image</Text>
            </View>
            <Feather name='maximize-2' size={16} color='#A3A3A3' />
          </Pressable>
        ) : null}

        {/* Full-screen receipt viewer modal */}
        {tx.receiptUrl ? (
          <Modal
            visible={receiptVisible}
            animationType='fade'
            statusBarTranslucent
            onRequestClose={() => setReceiptVisible(false)}
          >
            <StatusBar backgroundColor='#000' barStyle='light-content' />
            <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={{ uri: tx.receiptUrl }}
                style={{ width: '100%', height: '85%' }}
                contentFit='contain'
              />
              <Pressable
                onPress={() => setReceiptVisible(false)}
                style={{
                  position: 'absolute',
                  top: 56,
                  right: 20,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name='x' size={20} color='#fff' />
              </Pressable>
            </View>
          </Modal>
        ) : null}

        {/* Expense / Income Toggle */}
        {trackIncome ? (
          <View className='flex-row mx-6 mt-5 bg-white rounded-xl p-1'>
            <Pressable
              onPress={() => { setIsExpense(true); setSelectedCategoryId(''); }}
              className={`flex-1 py-3 rounded-lg items-center ${isExpense ? 'bg-black' : ''}`}
            >
              <Text className={`text-[14px] font-semibold ${isExpense ? 'text-white' : 'text-neutral-400'}`}>
                Expense
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setIsExpense(false); setSelectedCategoryId(''); }}
              className={`flex-1 py-3 rounded-lg items-center ${!isExpense ? 'bg-black' : ''}`}
            >
              <Text className={`text-[14px] font-semibold ${!isExpense ? 'text-white' : 'text-neutral-400'}`}>
                Income
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Amount */}
        <View className='mx-6 mt-6 bg-white rounded-2xl p-5'>
          <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>Amount</Text>
          <View className='flex-row items-center'>
            <Text className='text-[32px] font-bold text-black mr-1'>{getCurrencySymbol(currency)}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder='0'
              placeholderTextColor='#D4D4D4'
              keyboardType='decimal-pad'
              className='flex-1 text-[32px] font-bold text-black'
            />
          </View>
        </View>

        {/* Title */}
        <View className='mx-6 mt-4 bg-white rounded-2xl p-5'>
          <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder='e.g. Coffee, Salary...'
            placeholderTextColor='#D4D4D4'
            className='text-[16px] text-black'
          />
        </View>

        {/* Category — tappable row */}
        {(() => {
          const selectedCat = filteredCategories.find((c) => c._id === effectiveCategoryId);
          return (
            <Pressable
              onPress={() => setShowCategoryPicker(true)}
              className='mx-6 mt-4 bg-white rounded-2xl p-5 flex-row items-center'
            >
              <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider flex-1'>Category</Text>
              {selectedCat ? (
                <View className='flex-row items-center gap-2'>
                  <View
                    className='w-7 h-7 rounded-lg items-center justify-center'
                    style={{ backgroundColor: `${selectedCat.color}20` }}
                  >
                    <Feather name={selectedCat.icon as any} size={13} color={selectedCat.color} />
                  </View>
                  <Text className='text-[14px] font-medium text-black'>{selectedCat.name}</Text>
                </View>
              ) : (
                <Text className='text-[14px] text-neutral-400'>Select</Text>
              )}
              <Feather name='chevron-right' size={16} color='#A3A3A3' style={{ marginLeft: 8 }} />
            </Pressable>
          );
        })()}

        {/* Category picker modal */}
        <Modal
          visible={showCategoryPicker}
          animationType='slide'
          presentationStyle='pageSheet'
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <View className='flex-1 bg-neutral-50'>
            <View className='px-6 pt-5 pb-4 flex-row justify-between items-center border-b border-neutral-100'>
              <Text className='text-[18px] font-bold text-black'>Category</Text>
              <Pressable onPress={() => setShowCategoryPicker(false)}>
                <Feather name='x' size={20} color='#000' />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className='px-6 pt-4 pb-16'>
                {Object.entries(
                  filteredCategories.reduce((groups: Record<string, typeof filteredCategories>, cat) => {
                    const key = cat.parentCategory ?? 'Other';
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(cat);
                    return groups;
                  }, {})
                ).map(([parent, cats]) => (
                  <View key={parent} className='mt-5'>
                    <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 ml-1'>
                      {parent}
                    </Text>
                    <View className='bg-white rounded-2xl px-4'>
                      {cats.map((cat, i) => (
                        <Pressable
                          key={cat._id}
                          onPress={() => {
                            setSelectedCategoryId(cat._id);
                            setShowCategoryPicker(false);
                          }}
                          className={`flex-row items-center py-3.5 ${i < cats.length - 1 ? 'border-b border-neutral-100' : ''}`}
                        >
                          <View
                            className='w-8 h-8 rounded-lg items-center justify-center'
                            style={{ backgroundColor: `${cat.color}18` }}
                          >
                            <Feather name={cat.icon as any} size={14} color={cat.color} />
                          </View>
                          <Text className='flex-1 text-[14px] font-medium text-black ml-3'>{cat.name}</Text>
                          {effectiveCategoryId === cat._id && (
                            <Feather name='check' size={16} color='#000' />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Account Picker */}
        <View className='mx-6 mt-4 bg-white rounded-2xl p-5'>
          <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>Account</Text>
          <View className='flex-row flex-wrap gap-2'>
            {(accounts ?? []).map((acc) => (
              <Pressable
                key={acc._id}
                onPress={() => setSelectedAccountId(acc._id)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl ${
                  effectiveAccountId === acc._id ? 'bg-black' : 'bg-neutral-100'
                }`}
              >
                <Feather
                  name={acc.icon as any}
                  size={14}
                  color={effectiveAccountId === acc._id ? '#fff' : '#000'}
                />
                <Text
                  className={`text-[13px] font-medium ${
                    effectiveAccountId === acc._id ? 'text-white' : 'text-black'
                  }`}
                >
                  {acc.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Date */}
        <View className='mx-6 mt-4 bg-white rounded-2xl p-5'>
          <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>Date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder='YYYY-MM-DD'
            placeholderTextColor='#D4D4D4'
            className='text-[16px] text-black'
            keyboardType='numbers-and-punctuation'
          />
        </View>

        {/* Note */}
        <View className='mx-6 mt-4 bg-white rounded-2xl p-5'>
          <Text className='text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3'>Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder='Optional note...'
            placeholderTextColor='#D4D4D4'
            className='text-[16px] text-black'
            multiline
          />
        </View>

        {/* Save Button */}
        <View className='mx-6 mt-6'>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={`py-4 rounded-2xl items-center ${canSave ? 'bg-black' : 'bg-neutral-300'}`}
          >
            {isSaving ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <Text className='text-white font-bold text-[16px]'>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
