import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useCachedAccounts } from '@/lib/hooks/useCachedAccounts';
import { enqueue, type QueuedTransaction } from '@/lib/offlineQueue';
import { usePendingStore } from '@/lib/stores/usePendingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { localDateString } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from 'convex/react'; // still needed for prefs (currency, trackIncome)

const SCAN_URL = `${process.env.EXPO_PUBLIC_AUTH_URL}/api/scan-receipt`;

export default function AddTransactionScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';

  // Cached: loads instantly from AsyncStorage, syncs with Convex in background
  const accounts = useCachedAccounts();

  const prefs = useQuery(api.preferences.get, userId ? { userId } : 'skip');
  const currency = prefs?.currency ?? 'INR';
  const trackIncome = prefs?.trackIncome ?? true;

  const addPending = usePendingStore((s) => s.add);
  const requestSync = usePendingStore((s) => s.requestSync);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isExpense, setIsExpense] = useState(true);
  const [note, setNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const effectiveAccountId =
    selectedAccountId && accounts.find((a) => a._id === selectedAccountId)
      ? selectedAccountId
      : accounts[0]?._id ?? '';

  const handleScan = async () => {
    // Fail fast if offline — no point going through camera flow
    const net = await NetInfo.fetch();
    if (!net.isConnected || !net.isInternetReachable) {
      Alert.alert(
        'No Internet Connection',
        'An internet connection is required to scan receipts. Connect to the internet and try again.',
      );
      return;
    }

    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Camera access is needed to scan receipts.');
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
      // Compress image to reduce upload size (max 1200px wide, 70% quality)
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!compressed.base64) throw new Error('Compression failed');

      const res = await fetch(SCAN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: compressed.base64, mimeType: 'image/jpeg' }),
      });

      if (!res.ok) throw new Error(`Scan API error ${res.status}`);

      const data = await res.json() as {
        title: string;
        amount: number;
        date: string | null;
        isExpense: boolean;
        note: string;
        receiptUrl: string;
      };

      // Pre-fill form with AI-extracted data
      if (data.title) setTitle(data.title);
      if (data.amount) setAmount(String(data.amount));
      setIsExpense(data.isExpense ?? true);
      if (data.note) setNote(data.note);
      if (data.receiptUrl) setReceiptUrl(data.receiptUrl);
    } catch (err) {
      console.error('[ScanReceipt]', err);
      Alert.alert('Scan Failed', 'Could not read the receipt. Please fill in the details manually.');
      setReceiptPreview('');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0 || !effectiveAccountId) return;
    if (!userId) return;

    const today = localDateString(); // device local date, not UTC
    const localId = Crypto.randomUUID();

    const selectedAccount = accounts.find((a) => a._id === effectiveAccountId);

    const pending: QueuedTransaction = {
      localId,
      userId,
      title: title.trim(),
      amount: isExpense ? -numAmount : numAmount,
      note: note.trim(),
      date: today,
      categoryId: '',            // set server-side by OpenAI after sync
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

    // 1. Show in UI immediately
    addPending(pending);
    // 2. Persist to AsyncStorage (survives app close)
    await enqueue(pending);
    // 3. Go back — user sees it instantly in home list
    router.back();
    // 4. Signal the background sync hook (in CustomTabBar) to flush now
    requestSync();
  };

  const canSave = !!title.trim() && !!amount && !!effectiveAccountId;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center">
            <Feather name="x" size={20} color="#000" />
          </Pressable>
          <Text className="text-[18px] font-bold text-black">Add Transaction</Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setIsBookmarked((v) => !v)}
              className="w-10 h-10 rounded-full bg-white items-center justify-center"
            >
              <Feather name="bookmark" size={20} color={isBookmarked ? '#000' : '#A3A3A3'} />
            </Pressable>
            {/* Scan receipt button */}
            <Pressable
              onPress={handleScan}
              disabled={isScanning}
              className="w-10 h-10 rounded-full bg-white items-center justify-center"
            >
              {isScanning
                ? <ActivityIndicator size="small" color="#000" />
                : <Feather name="camera" size={20} color="#000" />
              }
            </Pressable>
          </View>
        </View>

        {/* Scanning overlay message */}
        {isScanning && (
          <View className="mx-6 mt-2 bg-black rounded-xl px-4 py-3 flex-row items-center gap-3">
            <ActivityIndicator size="small" color="#fff" />
            <Text className="text-white text-[13px] font-medium">Reading receipt with AI…</Text>
          </View>
        )}

        {/* Receipt preview thumbnail (shown after scan) */}
        {receiptPreview && !isScanning && (
          <View className="mx-6 mt-3 bg-white rounded-2xl p-3 flex-row items-center gap-3">
            <Image
              source={{ uri: receiptPreview }}
              style={{ width: 52, height: 72, borderRadius: 8 }}
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text className="text-[12px] font-semibold text-black">Receipt scanned</Text>
              <Text className="text-[11px] text-neutral-400 mt-0.5">Review and edit details below</Text>
            </View>
            <Pressable onPress={handleScan}>
              <Feather name="refresh-cw" size={16} color="#A3A3A3" />
            </Pressable>
          </View>
        )}

        {/* Expense / Income Toggle */}
        {trackIncome ? (
          <View className="flex-row mx-6 mt-5 bg-white rounded-xl p-1">
            <Pressable
              onPress={() => setIsExpense(true)}
              className={`flex-1 py-3 rounded-lg items-center ${isExpense ? 'bg-black' : ''}`}
            >
              <Text className={`text-[14px] font-semibold ${isExpense ? 'text-white' : 'text-neutral-400'}`}>
                Expense
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsExpense(false)}
              className={`flex-1 py-3 rounded-lg items-center ${!isExpense ? 'bg-black' : ''}`}
            >
              <Text className={`text-[14px] font-semibold ${!isExpense ? 'text-white' : 'text-neutral-400'}`}>
                Income
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Amount */}
        <View className="mx-6 mt-6 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Amount</Text>
          <View className="flex-row items-center">
            <Text className="text-[32px] font-bold text-black mr-1">{getCurrencySymbol(currency)}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#D4D4D4"
              keyboardType="decimal-pad"
              className="flex-1 text-[32px] font-bold text-black"
            />
          </View>
        </View>

        {/* Title */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Coffee, Salary..."
            placeholderTextColor="#D4D4D4"
            className="text-[16px] text-black"
          />
        </View>

        {/* Account Picker */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Account</Text>
          {accounts.length === 0 ? (
            <Text className="text-neutral-300 text-[14px]">Loading accounts…</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {accounts.map((acc) => (
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
          )}
        </View>

        {/* Note */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider mb-3">Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note..."
            placeholderTextColor="#D4D4D4"
            className="text-[16px] text-black"
            multiline
          />
        </View>

        {/* Auto-categorize hint */}
        <View className="mx-6 mt-3 flex-row items-center gap-2">
          <Feather name="zap" size={12} color="#A3A3A3" />
          <Text className="text-[12px] text-neutral-400">
            Category will be assigned automatically using AI
          </Text>
        </View>

        {/* Save Button */}
        <View className="mx-6 mt-6">
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={`py-4 rounded-2xl items-center ${canSave ? 'bg-black' : 'bg-neutral-300'}`}
          >
            <Text className="text-white font-bold text-[16px]">Save Transaction</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
