import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useAuthenticatedUserId } from '@/lib/hooks/useAuthenticatedUserId';
import { useCachedAccounts } from '@/lib/hooks/useCachedAccounts';
import { enqueue, type QueuedTransaction } from '@/lib/offlineQueue';
import { usePendingStore } from '@/lib/stores/usePendingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { localDateString } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useQuery } from 'convex/react';
import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

const STORED_USER_ID_KEY = 'spendler_user_id';
const TX_COUNT_KEY = 'spendler_tx_count';
const RATING_REQUESTED_KEY = 'spendler_rating_requested';

const SCAN_URL = `${process.env.EXPO_PUBLIC_AUTH_URL}/api/scan-receipt`;

export default function AddTransactionScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';
  const authenticatedUserId = useAuthenticatedUserId();

  const accounts = useCachedAccounts();

  const prefs = useQuery(
    api.preferences.get,
    authenticatedUserId ? { userId: authenticatedUserId } : 'skip'
  );
  const currency = prefs?.currency ?? 'INR';
  const trackIncome = prefs?.trackIncome ?? true;

  const addPending = usePendingStore((s) => s.add);
  const requestSync = usePendingStore((s) => s.requestSync);

  const amountRef = useRef<TextInput>(null);
  const titleRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  // Per-character amount animation
  const lastCharY = useRef(new Animated.Value(0)).current;
  const lastCharOpacity = useRef(new Animated.Value(1)).current;
  const prevAmountRef = useRef('');

  useEffect(() => {
    if (amount === prevAmountRef.current) return;
    const adding = amount.length > prevAmountRef.current.length;
    prevAmountRef.current = amount;

    // Adding → slide in from top. Deleting → slide in from bottom.
    lastCharY.setValue(adding ? -14 : 14);
    lastCharOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(lastCharY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 300,
      }),
      Animated.timing(lastCharOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [amount]);
  const [isExpense, setIsExpense] = useState(true);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const effectiveAccountId =
    selectedAccountId && accounts.find((a) => a._id === selectedAccountId)
      ? selectedAccountId
      : (accounts[0]?._id ?? '');

  const handleScan = async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected || !net.isInternetReachable) {
      Alert.alert(
        'No Internet Connection',
        'An internet connection is required to scan receipts. Connect to the internet and try again.'
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'Camera access is needed to scan receipts.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setReceiptPreview(asset.uri);
    setIsScanning(true);

    try {
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1200 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!compressed.base64) throw new Error('Compression failed');

      const res = await fetch(SCAN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: 'image/jpeg',
        }),
      });

      if (!res.ok) throw new Error(`Scan API error ${res.status}`);

      const data = (await res.json()) as {
        title: string;
        amount: number;
        date: string | null;
        isExpense: boolean;
        note: string;
        receiptUrl: string;
      };

      if (data.title) setTitle(data.title);
      if (data.amount) setAmount(String(data.amount));
      setIsExpense(data.isExpense ?? true);
      if (data.note) setNote(data.note);
      if (data.receiptUrl) setReceiptUrl(data.receiptUrl);
    } catch (err) {
      console.error('[ScanReceipt]', err);
      Alert.alert(
        'Scan Failed',
        'Could not read the receipt. Please fill in the details manually.'
      );
      setReceiptPreview('');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (
      !title.trim() ||
      isNaN(numAmount) ||
      numAmount <= 0 ||
      !effectiveAccountId
    )
      return;

    const resolvedUserId =
      userId || (await AsyncStorage.getItem(STORED_USER_ID_KEY)) || '';
    if (!resolvedUserId) return;

    const today = localDateString();
    const localId = Crypto.randomUUID();

    const selectedAccount = accounts.find((a) => a._id === effectiveAccountId);

    const pending: QueuedTransaction = {
      localId,
      userId: resolvedUserId,
      title: title.trim(),
      amount: isExpense ? -numAmount : numAmount,
      note: note.trim(),
      date: today,
      categoryId: '',
      accountId: effectiveAccountId,
      categoryName: 'Categorizing…',
      categoryIcon: 'tag',
      accountName: selectedAccount?.name ?? '',
      accountIcon: selectedAccount?.icon ?? 'credit-card',
      createdAt: new Date().toISOString(),
      retries: 0,
      receiptUrl: receiptUrl || undefined,
      isBookmarked: isBookmarked || undefined,
    };

    addPending(pending);
    await enqueue(pending);
    router.back();
    requestSync();

    const alreadyRequested = await AsyncStorage.getItem(RATING_REQUESTED_KEY);
    if (!alreadyRequested) {
      const raw = await AsyncStorage.getItem(TX_COUNT_KEY);
      const count = parseInt(raw ?? '0', 10) + 1;
      await AsyncStorage.setItem(TX_COUNT_KEY, String(count));
      if (count >= 5 && (await StoreReview.hasAction())) {
        await AsyncStorage.setItem(RATING_REQUESTED_KEY, 'true');
        await StoreReview.requestReview();
      }
    }
  };

  const canSave = !!title.trim() && !!amount && !!effectiveAccountId;

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-neutral-50'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 30}
    >
      {/* Header */}
      <View className='px-5 pt-4 pb-3 flex-row justify-between items-center'>
        <Pressable
          onPress={() => router.back()}
          className='w-9 h-9 rounded-full bg-white items-center justify-center'
        >
          <Feather name='x' size={18} color='#000' />
        </Pressable>
        <Text className='text-[16px] font-bold text-black'>
          Add Transaction
        </Text>
        <View className='flex-row items-center gap-2'>
          <Pressable
            onPress={() => setIsBookmarked((v) => !v)}
            className='w-9 h-9 rounded-full bg-white items-center justify-center'
          >
            <Feather
              name='bookmark'
              size={18}
              color={isBookmarked ? '#000' : '#A3A3A3'}
            />
          </Pressable>
          <Pressable
            onPress={handleScan}
            disabled={isScanning}
            className='w-9 h-9 rounded-full bg-white items-center justify-center'
          >
            {isScanning ? (
              <ActivityIndicator size='small' color='#000' />
            ) : (
              <Feather name='camera' size={18} color='#000' />
            )}
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
        >
          {/* Scanning overlay */}
          {isScanning && (
            <View className='mx-5 mb-3 bg-black rounded-xl px-4 py-3 flex-row items-center gap-3'>
              <ActivityIndicator size='small' color='#fff' />
              <Text className='text-white text-[13px] font-medium'>
                Reading receipt with AI…
              </Text>
            </View>
          )}

          {/* Receipt preview */}
          {receiptPreview && !isScanning && (
            <View className='mx-5 mb-3 bg-white rounded-2xl p-3 flex-row items-center gap-3'>
              <Image
                source={{ uri: receiptPreview }}
                style={{ width: 48, height: 64, borderRadius: 8 }}
                resizeMode='cover'
              />
              <View className='flex-1'>
                <Text className='text-[12px] font-semibold text-black'>
                  Receipt scanned
                </Text>
                <Text className='text-[11px] text-neutral-400 mt-0.5'>
                  Review and edit details below
                </Text>
              </View>
              <Pressable onPress={handleScan}>
                <Feather name='refresh-cw' size={16} color='#A3A3A3' />
              </Pressable>
            </View>
          )}

          {/* Expense / Income toggle */}
          {trackIncome && (
            <View className='flex-row mx-5 bg-white rounded-xl p-1 mb-3'>
              <Pressable
                onPress={() => setIsExpense(true)}
                className={`flex-1 py-2.5 rounded-lg items-center ${isExpense ? 'bg-black' : ''}`}
              >
                <Text
                  className={`text-[13px] font-semibold ${isExpense ? 'text-white' : 'text-neutral-400'}`}
                >
                  Expense
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setIsExpense(false)}
                className={`flex-1 py-2.5 rounded-lg items-center ${!isExpense ? 'bg-black' : ''}`}
              >
                <Text
                  className={`text-[13px] font-semibold ${!isExpense ? 'text-white' : 'text-neutral-400'}`}
                >
                  Income
                </Text>
              </Pressable>
            </View>
          )}

          {/* Main input card — amount + title + optional note */}
          <View className='mx-5 bg-white rounded-2xl overflow-hidden'>
            {/* Amount */}
            <Pressable
              className='px-5 pt-5 pb-4'
              onPress={() => amountRef.current?.focus()}
            >
              <View className='flex-row items-center'>
                {/* Currency symbol — always static */}
                <Text
                  style={{
                    fontSize: 38,
                    fontWeight: 'bold',
                    color: '#000',
                    marginRight: 2,
                  }}
                >
                  {getCurrencySymbol(currency)}
                </Text>

                {/* Stable digits — everything except the last character */}
                {amount.length > 1 && (
                  <Text
                    style={{ fontSize: 38, fontWeight: 'bold', color: '#000' }}
                  >
                    {amount.slice(0, -1)}
                  </Text>
                )}

                {/* Animated last character */}
                <Animated.Text
                  style={{
                    fontSize: 38,
                    fontWeight: 'bold',
                    color: amount ? '#000' : '#D4D4D4',
                    opacity: lastCharOpacity,
                    transform: [{ translateY: lastCharY }],
                  }}
                >
                  {amount.slice(-1) || '0'}
                </Animated.Text>

                {/* Hidden TextInput — captures keyboard input only */}
                <TextInput
                  ref={amountRef}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType='decimal-pad'
                  autoFocus
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: 1,
                    height: 1,
                  }}
                />
              </View>
            </Pressable>

            {/* Dashed divider */}
            <View
              style={{
                marginHorizontal: 20,
                borderBottomWidth: 1,
                borderColor: '#E5E5E5',
                borderStyle: 'dashed',
              }}
            />

            {/* Title + note icon */}
            <Pressable
              className='px-5 py-4 flex-row items-center'
              onPress={() => titleRef.current?.focus()}
            >
              <TextInput
                ref={titleRef}
                value={title}
                onChangeText={setTitle}
                placeholder='What was it? e.g. Coffee, Salary'
                placeholderTextColor='#D4D4D4'
                className='flex-1 text-[15px] text-black'
              />
              <Pressable
                onPress={() => {
                  setShowNote((v) => !v);
                  if (!showNote) setTimeout(() => noteRef.current?.focus(), 50);
                }}
                className='ml-3 w-8 h-8 items-center justify-center'
              >
                <Feather
                  name='edit-3'
                  size={16}
                  color={showNote || note ? '#000' : '#D4D4D4'}
                />
              </Pressable>
            </Pressable>

            {/* Note — shown only when toggled */}
            {showNote && (
              <>
                <View
                  style={{
                    marginHorizontal: 20,
                    borderBottomWidth: 1,
                    borderColor: '#E5E5E5',
                    borderStyle: 'dashed',
                  }}
                />
                <Pressable
                  className='px-5 py-3'
                  onPress={() => noteRef.current?.focus()}
                >
                  <TextInput
                    ref={noteRef}
                    value={note}
                    onChangeText={setNote}
                    placeholder='Add a note...'
                    placeholderTextColor='#D4D4D4'
                    className='text-[14px] text-black'
                    multiline
                  />
                </Pressable>
              </>
            )}
          </View>

          {/* Account picker */}
          <View className='mx-5 mt-3 bg-white rounded-2xl px-5 py-4'>
            <Text className='text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mb-3'>
              Account
            </Text>
            {accounts.length === 0 ? (
              <Text className='text-neutral-300 text-[14px]'>Loading…</Text>
            ) : (
              <View className='flex-row flex-wrap gap-2'>
                {accounts.map((acc) => (
                  <Pressable
                    key={acc._id}
                    onPress={() => setSelectedAccountId(acc._id)}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${
                      effectiveAccountId === acc._id
                        ? 'bg-black'
                        : 'bg-neutral-100'
                    }`}
                  >
                    <Feather
                      name={acc.icon as any}
                      size={13}
                      color={effectiveAccountId === acc._id ? '#fff' : '#000'}
                    />
                    <Text
                      className={`text-[13px] font-medium ${
                        effectiveAccountId === acc._id
                          ? 'text-white'
                          : 'text-black'
                      }`}
                    >
                      {acc.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* AI hint */}
          <View className='mx-5 mt-2.5 flex-row items-center gap-1.5'>
            <Feather name='zap' size={11} color='#A3A3A3' />
            <Text className='text-[11px] text-neutral-400'>
              Category will be assigned automatically using AI
            </Text>
          </View>
        </ScrollView>

        {/* Save button — outside scroll, inside flex-1 wrapper = always above keyboard */}
        <View className='px-5 pb-10 pt-3 bg-neutral-50'>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={`py-4 rounded-2xl items-center ${canSave ? 'bg-black' : 'bg-neutral-200'}`}
          >
            <Text
              className={`font-bold text-[16px] ${canSave ? 'text-white' : 'text-neutral-400'}`}
            >
              Save Transaction
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
