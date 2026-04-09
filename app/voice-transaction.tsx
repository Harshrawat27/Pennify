import { authClient } from '@/lib/auth-client';
import { useCachedAccounts } from '@/lib/hooks/useCachedAccounts';
import { useCachedCurrency } from '@/lib/hooks/useCachedCurrency';
import { enqueue } from '@/lib/offlineQueue';
import { usePendingStore } from '@/lib/stores/usePendingStore';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { localDateString } from '@/lib/utils/date';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { router, useNavigation } from 'expo-router';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STORED_USER_ID_KEY = 'spendler_user_id';

// ── Parser ────────────────────────────────────────────────────────────────────

interface Parsed {
  amount: number;
  title: string;
  note: string;
  isExpense: boolean;
}

function parseVoiceInput(text: string): Parsed | null {
  const lower = text.toLowerCase().trim();

  // Extract note: everything after the word "note"
  let core = lower;
  let note = '';
  const noteIdx = lower.search(/\bnote\b/);
  if (noteIdx !== -1) {
    note = text.slice(noteIdx + 4).trim();
    core = lower.slice(0, noteIdx).trim();
  }

  // Detect income keywords
  const incomeKeywords = ['received', 'earned', 'income', 'salary', 'got paid', 'got'];
  const isExpense = !incomeKeywords.some((k) => core.includes(k));

  // Remove filler words
  const fillers = ['spent', 'spend', 'paid', 'pay', 'bought', 'for', 'on', 'received', 'earned', 'got paid', 'got', 'income', 'salary'];
  let cleaned = core;
  fillers.forEach((f) => {
    cleaned = cleaned.replace(new RegExp(`\\b${f}\\b`, 'g'), '');
  });
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Match amount — support "$40", "40 dollars", "40.50", plain "40"
  const amountMatch = cleaned.match(/\$?([\d]+(?:[.,]\d{1,2})?)\s*(?:dollars?|bucks?)?/);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(',', '.'));
  if (isNaN(amount) || amount <= 0) return null;

  // Remove the matched amount from cleaned to get title
  const title = cleaned
    .replace(amountMatch[0], '')
    .replace(/dollars?|bucks?/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) return null;

  // Capitalize first letter of title
  const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);

  return { amount, title: formattedTitle, note, isExpense };
}

// ── Ripple ring component ─────────────────────────────────────────────────────

function RippleRing({ delay, listening }: { delay: number; listening: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (listening) {
      anim.current = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 2.2,
              duration: 1400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      anim.current.start();
    } else {
      anim.current?.stop();
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
    return () => anim.current?.stop();
  }, [listening]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 2,
        borderColor: '#fff',
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

type Status = 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'no_match';

export default function VoiceTransactionScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const accounts = useCachedAccounts();
  const currency = useCachedCurrency();
  const { addPending } = usePendingStore();

  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const micScale = useRef(new Animated.Value(1)).current;
  const micPulse = useRef<Animated.CompositeAnimation | null>(null);

  function goBack() {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  // Mic button pulse while listening
  useEffect(() => {
    if (status === 'listening') {
      micPulse.current = Animated.loop(
        Animated.sequence([
          Animated.timing(micScale, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(micScale, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      micPulse.current.start();
    } else {
      micPulse.current?.stop();
      Animated.timing(micScale, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [status]);

  // Speech recognition events
  useSpeechRecognitionEvent('result', (e) => {
    const text = e.results[0]?.transcript ?? '';
    setTranscript(text);
  });

  useSpeechRecognitionEvent('end', () => {
    if (status !== 'listening') return;
    setStatus('processing');
  });

  useSpeechRecognitionEvent('error', (e) => {
    console.log('[Voice] error', e.error);
    setStatus('error');
    setErrorMsg('Could not hear you. Tap to try again.');
  });

  // Auto-process when status hits processing
  useEffect(() => {
    if (status !== 'processing') return;
    if (!transcript.trim()) {
      setStatus('no_match');
      return;
    }
    const result = parseVoiceInput(transcript);
    if (!result) {
      setStatus('no_match');
      return;
    }
    setParsed(result);
    saveTransaction(result);
  }, [status]);

  async function saveTransaction(p: Parsed) {
    try {
      const resolvedUserId =
        userId || (await AsyncStorage.getItem(STORED_USER_ID_KEY)) || '';
      if (!resolvedUserId) { setStatus('error'); setErrorMsg('Not signed in.'); return; }

      const accountId = accounts[0]?._id ?? '';
      const accountName = accounts[0]?.name ?? '';
      const accountIcon = accounts[0]?.icon ?? 'credit-card';
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
      setStatus('success');

      // Auto-dismiss after success
      setTimeout(() => goBack(), 1200);
    } catch {
      setStatus('error');
      setErrorMsg('Failed to save. Tap to try again.');
    }
  }

  async function startListening() {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      setStatus('error');
      setErrorMsg('Microphone permission denied.');
      return;
    }
    setTranscript('');
    setParsed(null);
    setErrorMsg('');
    setStatus('listening');
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  }

  function stopListening() {
    ExpoSpeechRecognitionModule.stop();
    setStatus('processing');
  }

  const symbol = getCurrencySymbol(currency);

  // Labels
  const statusLabel: Record<Status, string> = {
    idle: 'Tap mic to start',
    listening: 'Listening…',
    processing: 'Processing…',
    success: 'Saved!',
    error: errorMsg || 'Something went wrong',
    no_match: 'Try again — say "coffee 40"',
  };

  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isSuccess = status === 'success';

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Close button */}
      <Pressable
        onPress={goBack}
        style={{
          position: 'absolute',
          top: insets.top + 16,
          right: 20,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 18, lineHeight: 20 }}>✕</Text>
      </Pressable>

      {/* Main content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

        {/* Ripple rings */}
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 88, height: 88 }}>
          <RippleRing delay={0} listening={isListening} />
          <RippleRing delay={350} listening={isListening} />
          <RippleRing delay={700} listening={isListening} />

          {/* Mic button */}
          <Pressable
            onPress={isListening ? stopListening : startListening}
            disabled={isProcessing || isSuccess}
          >
            <Animated.View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: isSuccess ? '#22c55e' : isListening ? '#fff' : 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: micScale }],
              }}
            >
              <Text style={{ fontSize: 36 }}>
                {isSuccess ? '✓' : isProcessing ? '⋯' : '🎙️'}
              </Text>
            </Animated.View>
          </Pressable>
        </View>

        {/* Status text */}
        <Text
          style={{
            color: isSuccess ? '#22c55e' : 'rgba(255,255,255,0.7)',
            fontSize: 16,
            fontWeight: '500',
            marginTop: 40,
            textAlign: 'center',
            paddingHorizontal: 32,
          }}
        >
          {statusLabel[status]}
        </Text>

        {/* Live transcript */}
        {(isListening || isProcessing) && !!transcript && (
          <Text
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              marginTop: 12,
              textAlign: 'center',
              paddingHorizontal: 40,
            }}
          >
            "{transcript}"
          </Text>
        )}

        {/* Parsed result card */}
        {isSuccess && parsed && (
          <View
            style={{
              marginTop: 24,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 16,
              paddingHorizontal: 24,
              paddingVertical: 16,
              alignItems: 'center',
              minWidth: 200,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
              {parsed.isExpense ? '-' : '+'}{symbol}{parsed.amount.toFixed(0)}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 4 }}>
              {parsed.title}
            </Text>
            {!!parsed.note && (
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
                {parsed.note}
              </Text>
            )}
          </View>
        )}

        {/* Hint */}
        {status === 'idle' && (
          <Text
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 12,
              marginTop: 48,
              textAlign: 'center',
              paddingHorizontal: 40,
              lineHeight: 18,
            }}
          >
            Say something like{'\n'}"Coffee 40" or "Groceries 120 note weekly shop"
          </Text>
        )}
      </View>
    </View>
  );
}
