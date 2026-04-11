import { authClient } from '@/lib/auth-client';
import { useCachedAccounts } from '@/lib/hooks/useCachedAccounts';
import { useCachedCurrency } from '@/lib/hooks/useCachedCurrency';
import { enqueue } from '@/lib/offlineQueue';
import { usePendingStore } from '@/lib/stores/usePendingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { localDateString } from '@/lib/utils/date';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { router, useNavigation } from 'expo-router';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STORED_USER_ID_KEY = 'spendler_user_id';

// ── Parser ────────────────────────────────────────────────────────────────────

interface Parsed {
  amount: number;
  title: string;
  note: string;
  isExpense: boolean;
}

const WORD_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
};

function wordsToNumber(text: string): string {
  // Replace patterns like "two hundred", "one fifty", "two hundred fifty", "a hundred"
  let result = text.replace(/\ba\b/g, 'one');

  // Handle "X hundred Y" → X*100 + Y
  result = result.replace(
    /\b([\w]+)\s+hundred(?:\s+and)?\s+([\w]+)\b/gi,
    (_, a, b) => {
      const aVal = WORD_NUMBERS[a.toLowerCase()];
      const bVal = WORD_NUMBERS[b.toLowerCase()];
      if (aVal !== undefined && bVal !== undefined)
        return String(aVal * 100 + bVal);
      return _;
    }
  );

  // Handle "X hundred" → X*100
  result = result.replace(/\b([\w]+)\s+hundred\b/gi, (_, a) => {
    const aVal = WORD_NUMBERS[a.toLowerCase()];
    if (aVal !== undefined) return String(aVal * 100);
    return _;
  });

  // Handle "X thousand" → X*1000
  result = result.replace(/\b([\w]+)\s+thousand\b/gi, (_, a) => {
    const aVal = WORD_NUMBERS[a.toLowerCase()];
    if (aVal !== undefined) return String(aVal * 1000);
    return _;
  });

  // Handle "twenty five" style (tens + ones)
  result = result.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\s+(one|two|three|four|five|six|seven|eight|nine|ten)\b/gi,
    (_, tens, ones) => {
      const t = WORD_NUMBERS[tens.toLowerCase()];
      const o = WORD_NUMBERS[ones.toLowerCase()];
      if (t !== undefined && o !== undefined) return String(t + o);
      return _;
    }
  );

  // Replace remaining single word numbers
  result = result.replace(
    /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b/gi,
    (w) => {
      const val = WORD_NUMBERS[w.toLowerCase()];
      return val !== undefined ? String(val) : w;
    }
  );

  return result;
}

function parseVoiceInput(text: string): Parsed | null {
  const lower = wordsToNumber(text.toLowerCase().trim());
  if (!lower) return null;

  let core = lower;
  let note = '';
  const noteMatch = lower.match(/\bnote\b(.*)/);
  if (noteMatch) {
    note = noteMatch[1].trim();
    core = lower.slice(0, lower.search(/\bnote\b/)).trim();
  }

  const incomeKeywords = ['received', 'earned', 'income', 'salary', 'got paid'];
  const isExpense = !incomeKeywords.some((k) => core.includes(k));

  const fillers = [
    'spent',
    'spend',
    'paid',
    'pay',
    'bought',
    'buy',
    'for',
    'on',
    'received',
    'earned',
    'got paid',
    'income',
    'salary',
  ];
  let cleaned = core;
  fillers.forEach((f) => {
    cleaned = cleaned.replace(new RegExp(`\\b${f}\\b`, 'gi'), ' ');
  });
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  const amountMatch = cleaned.match(
    /\$?([\d]+(?:[.,]\d{1,2})?)\s*(?:dollars?|bucks?)?/
  );
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(',', '.'));
  if (isNaN(amount) || amount <= 0) return null;

  let title = cleaned
    .replace(amountMatch[0], '')
    .replace(/\b(dollars?|bucks?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) return null;
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { amount, title, note, isExpense };
}

// ── Equalizer bars ────────────────────────────────────────────────────────────

const BAR_COUNT = 5;
const BAR_MAX_H = 48;
const BAR_MIN_H = 4;
const BAR_SPEEDS = [700, 500, 900, 600, 800];
const BAR_DELAYS = [0, 150, 80, 220, 60];

function EqualizerBars({ active }: { active: boolean }) {
  const heights = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(BAR_MIN_H))
  ).current;
  const anims = useRef<(Animated.CompositeAnimation | null)[]>(
    Array(BAR_COUNT).fill(null)
  ).current;

  useEffect(() => {
    heights.forEach((h, i) => {
      anims[i]?.stop();
      if (active) {
        const randomTarget = () =>
          BAR_MIN_H + Math.random() * (BAR_MAX_H - BAR_MIN_H);
        anims[i] = Animated.loop(
          Animated.sequence([
            Animated.delay(BAR_DELAYS[i]),
            Animated.timing(h, {
              toValue: randomTarget(),
              duration: BAR_SPEEDS[i],
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(h, {
              toValue: randomTarget(),
              duration: BAR_SPEEDS[i],
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
        anims[i]!.start();
      } else {
        Animated.timing(h, {
          toValue: BAR_MIN_H,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      }
    });
    return () => anims.forEach((a) => a?.stop());
  }, [active]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: BAR_MAX_H + 8,
      }}
    >
      {heights.map((h, i) => (
        <Animated.View
          key={i}
          style={{
            width: 4,
            height: h,
            borderRadius: 3,
            backgroundColor: active
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(255,255,255,0.2)',
          }}
        />
      ))}
    </View>
  );
}

// ── Success card ──────────────────────────────────────────────────────────────

function SuccessCard({
  parsed,
  symbol,
  accountName,
}: {
  parsed: Parsed;
  symbol: string;
  accountName: string;
}) {
  const slideY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const amountColor = parsed.isExpense ? '#ef4444' : '#22c55e';
  const amountStr =
    (parsed.isExpense ? '-' : '+') +
    symbol +
    (parsed.amount % 1 === 0
      ? parsed.amount.toFixed(0)
      : parsed.amount.toFixed(2));

  return (
    <Animated.View
      style={{
        marginTop: 28,
        width: '100%',
        opacity,
        transform: [{ translateY: slideY }],
      }}
    >
      <View
        style={{
          backgroundColor: '#111',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Colour accent strip */}
        <View
          style={{
            height: 4,
            backgroundColor: amountColor,
            width: '100%',
          }}
        />

        <View style={{ padding: 24 }}>
          {/* Amount */}
          <Text
            style={{
              fontSize: 42,
              fontWeight: 'bold',
              color: amountColor,
              letterSpacing: -1,
            }}
          >
            {amountStr}
          </Text>

          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#fff',
              marginTop: 6,
            }}
          >
            {parsed.title}
          </Text>

          {/* Note */}
          {!!parsed.note && (
            <Text
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)',
                marginTop: 4,
              }}
            >
              {parsed.note}
            </Text>
          )}

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.07)',
              marginVertical: 16,
            }}
          />

          {/* Bottom row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Category badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Feather name='tag' size={11} color='rgba(255,255,255,0.4)' />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                Categorizing…
              </Text>
            </View>

            {/* Account */}
            {!!accountName && (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
              >
                <Feather
                  name='credit-card'
                  size={11}
                  color='rgba(255,255,255,0.3)'
                />
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {accountName}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

type Status =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'success'
  | 'error'
  | 'no_match';

export default function VoiceTransactionScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const accounts = useCachedAccounts();
  const currency = useCachedCurrency();
  const addPending = usePendingStore((s) => s.add);
  const requestSync = usePendingStore((s) => s.requestSync);

  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const statusRef = useRef<Status>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoStarted = useRef(false);

  const micScale = useRef(new Animated.Value(1)).current;
  const micPulse = useRef<Animated.CompositeAnimation | null>(null);

  function goBack() {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  function updateStatus(s: Status) {
    statusRef.current = s;
    setStatus(s);
  }

  // Auto-start on mount
  useEffect(() => {
    if (hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    const t = setTimeout(() => startListening(), 400);
    return () => clearTimeout(t);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutRef.current && clearTimeout(timeoutRef.current);
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
    };
  }, []);

  // Mic button pulse
  useEffect(() => {
    if (status === 'listening') {
      micPulse.current = Animated.loop(
        Animated.sequence([
          Animated.timing(micScale, {
            toValue: 1.12,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(micScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      micPulse.current.start();
    } else {
      micPulse.current?.stop();
      Animated.timing(micScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  useSpeechRecognitionEvent('result', (e) => {
    const text = e.results[0]?.transcript ?? '';
    setTranscript(text);
    timeoutRef.current && clearTimeout(timeoutRef.current);
    if (!e.isFinal) {
      timeoutRef.current = setTimeout(() => {
        if (statusRef.current === 'listening') {
          ExpoSpeechRecognitionModule.stop();
        }
      }, 2000);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (statusRef.current !== 'listening') return;
    timeoutRef.current && clearTimeout(timeoutRef.current);
    updateStatus('processing');
  });

  useSpeechRecognitionEvent('error', (e) => {
    if (statusRef.current === 'success') return;
    timeoutRef.current && clearTimeout(timeoutRef.current);
    const msg =
      e.error === 'no-speech'
        ? "Couldn't hear you. Tap to try again."
        : e.error === 'not-allowed'
          ? 'Microphone permission denied.'
          : 'Something went wrong. Tap to try again.';
    setErrorMsg(msg);
    updateStatus('error');
  });

  // Process once status hits 'processing'
  useEffect(() => {
    if (status !== 'processing') return;
    if (!transcript.trim()) {
      updateStatus('no_match');
      return;
    }
    const result = parseVoiceInput(transcript);
    if (!result) {
      updateStatus('no_match');
      return;
    }
    setParsed(result);
    saveTransaction(result);
  }, [status]);

  async function saveTransaction(p: Parsed) {
    try {
      const resolvedUserId =
        userId || (await AsyncStorage.getItem(STORED_USER_ID_KEY)) || '';
      if (!resolvedUserId) {
        setErrorMsg('Not signed in.');
        updateStatus('error');
        return;
      }
      const accountId = accounts[0]?._id ?? '';
      const accountName = accounts[0]?.name ?? '';
      const accountIcon = (accounts[0] as any)?.icon ?? 'credit-card';
      const localId = Crypto.randomUUID();

      const pending = {
        localId,
        userId: resolvedUserId,
        title: p.title,
        amount: p.isExpense ? -p.amount : p.amount,
        note: p.note,
        date: localDateString(),
        categoryId: '',
        accountId,
        categoryName: 'Categorizing…',
        categoryIcon: 'tag',
        accountName,
        accountIcon,
        createdAt: new Date().toISOString(),
        retries: 0,
      };

      addPending(pending as any);
      await enqueue(pending as any);
      requestSync();
      updateStatus('success');
      setTimeout(() => goBack(), 1500);
    } catch {
      setErrorMsg('Failed to save. Tap to try again.');
      updateStatus('error');
    }
  }

  async function startListening() {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      setErrorMsg('Microphone permission denied.');
      updateStatus('error');
      return;
    }
    setTranscript('');
    setParsed(null);
    setErrorMsg('');
    updateStatus('listening');
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
    timeoutRef.current = setTimeout(() => {
      if (statusRef.current === 'listening') ExpoSpeechRecognitionModule.stop();
    }, 8000);
  }

  function stopListening() {
    timeoutRef.current && clearTimeout(timeoutRef.current);
    ExpoSpeechRecognitionModule.stop();
    updateStatus('processing');
  }

  const symbol = getCurrencySymbol(currency);
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isSuccess = status === 'success';
  const isError = status === 'error' || status === 'no_match';
  const canTap = !isProcessing && !isSuccess;

  const micBg = isSuccess
    ? '#22c55e'
    : isListening
      ? '#ffffff'
      : isError
        ? 'rgba(239,68,68,0.2)'
        : 'rgba(255,255,255,0.1)';

  const micColor = isListening ? '#000' : '#fff';

  const labelMap: Record<Status, string> = {
    idle: 'Starting…',
    listening: 'Listening — tap to stop',
    processing: 'Processing…',
    success: 'Saved!',
    error: errorMsg || 'Something went wrong',
    no_match: 'Try again — say "Coffee 40"',
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Close */}
      <Pressable
        onPress={goBack}
        style={{
          position: 'absolute',
          top: insets.top + 16,
          right: 20,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <Feather name='x' size={18} color='rgba(255,255,255,0.7)' />
      </Pressable>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        {/* Equalizer bars */}
        <EqualizerBars active={isListening} />

        {/* Mic button */}
        <Pressable
          onPress={isListening ? stopListening : startListening}
          disabled={!canTap}
          style={{ marginTop: 40 }}
        >
          <Animated.View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: micBg,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: micScale }],
            }}
          >
            {isSuccess ? (
              <Feather name='check' size={32} color='#fff' />
            ) : isProcessing ? (
              <Feather name='loader' size={28} color='rgba(255,255,255,0.6)' />
            ) : (
              <Feather name='mic' size={30} color={micColor} />
            )}
          </Animated.View>
        </Pressable>

        {/* Status label */}
        <Text
          style={{
            color: isSuccess
              ? '#22c55e'
              : isError
                ? '#ef4444'
                : 'rgba(255,255,255,0.55)',
            fontSize: 14,
            fontWeight: '500',
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          {labelMap[status]}
        </Text>

        {/* Live transcript pill */}
        {(isListening || isProcessing) && !!transcript && (
          <View
            style={{
              marginTop: 20,
              backgroundColor: 'rgba(255,255,255,0.07)',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              "{transcript}"
            </Text>
          </View>
        )}

        {/* Success card */}
        {isSuccess && parsed && (
          <SuccessCard
            parsed={parsed}
            symbol={symbol}
            accountName={accounts[0]?.name ?? ''}
          />
        )}

        {/* Idle / error hint */}
        {(status === 'idle' || isError) && (
          <Text
            style={{
              color: 'rgba(255,255,255,0.2)',
              fontSize: 12,
              marginTop: 48,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            Say "Coffee 40" or "Groceries 85 note weekly shop"
          </Text>
        )}
      </View>
    </View>
  );
}
