import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useAuthenticatedUserId } from '@/lib/hooks/useAuthenticatedUserId';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

// Simple markdown renderer that handles tables, bold, lists
function MarkdownView({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection: line contains | and next line is separator
    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      lines[i + 1].match(/^[\s|:-]+$/)
    ) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      // Parse table
      const rows = tableLines
        .filter((l) => !l.match(/^[\s|:-]+$/))
        .map((l) =>
          l
            .split('|')
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
        );
      if (rows.length > 0) {
        elements.push(
          <View
            key={`table-${i}`}
            className='mt-2 mb-2 rounded-xl overflow-hidden border border-neutral-100'
          >
            {rows.map((row, ri) => (
              <View
                key={ri}
                className={`flex-row ${ri === 0 ? 'bg-neutral-100' : ri % 2 === 0 ? 'bg-neutral-50' : 'bg-white'}`}
              >
                {row.map((cell, ci) => (
                  <Text
                    key={ci}
                    className={`flex-1 px-3 py-2 text-[12px] ${ri === 0 ? 'font-bold text-black' : 'text-neutral-700'}`}
                    numberOfLines={2}
                  >
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );
      }
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<View key={`space-${i}`} className='h-2' />);
      i++;
      continue;
    }

    // List item
    if (line.match(/^[-*•]\s/)) {
      elements.push(
        <View key={`li-${i}`} className='flex-row items-start mb-1'>
          <Text className='text-neutral-400 mr-2 mt-0.5'>•</Text>
          <Text className='flex-1 text-[14px] text-neutral-800 leading-5'>
            {renderInline(line.replace(/^[-*•]\s/, ''))}
          </Text>
        </View>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <Text
        key={`p-${i}`}
        className='text-[14px] text-neutral-800 leading-6 mb-1'
      >
        {renderInline(line)}
      </Text>
    );
    i++;
  }

  return <View>{elements}</View>;
}

function renderInline(text: string): React.ReactNode[] {
  // Handle **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} className='font-bold text-black'>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
};

const SUGGESTED = [
  'How much did I spend this month?',
  'What is my top spending category?',
  'Show my spending by category',
  'How does this month compare to last month?',
];

export default function FinanceChatScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const authenticatedUserId = useAuthenticatedUserId();

  const transactions = useQuery(
    api.transactions.listSixMonths,
    authenticatedUserId ? { userId: authenticatedUserId } : 'skip'
  );
  const prefs = useQuery(api.preferences.get, authenticatedUserId ? { userId: authenticatedUserId } : 'skip');
  const monthlyBudgetData = useQuery(
    api.monthlyBudgets.getByMonth,
    authenticatedUserId ? { userId: authenticatedUserId, month: new Date().toISOString().slice(0, 7) } : 'skip'
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const authUrl = process.env.EXPO_PUBLIC_AUTH_URL;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !transactions) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    const url = `${authUrl}/api/finance-chat`;
    const body = JSON.stringify({
      question: text.trim(),
      transactions,
      preferences: {
        currency: prefs?.currency ?? 'INR',
        monthlyBudget: monthlyBudgetData?.budget ?? null,
      },
    });

    // React Native fetch doesn't support response.body ReadableStream
    // Use XMLHttpRequest with onprogress for SSE streaming instead
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');

    let accumulated = '';
    let lastIndex = 0;

    xhr.onprogress = () => {
      const newChunk = xhr.responseText.slice(lastIndex);
      lastIndex = xhr.responseText.length;
      const lines = newChunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: accumulated, streaming: true }
                    : m
                )
              );
              scrollRef.current?.scrollToEnd({ animated: false });
            }
          } catch {}
        }
      }
    };

    xhr.onload = () => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      );
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    xhr.onerror = () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: 'Something went wrong. Please try again.',
                streaming: false,
              }
            : m
        )
      );
      setIsLoading(false);
    };

    xhr.send(body);
  };

  const isDataReady = transactions !== undefined;

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-neutral-50'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={40}
    >
      {/* Header */}
      <View className='px-6 pt-4 pb-3 bg-neutral-50 border-b border-neutral-100 flex-row items-center gap-4'>
        <Pressable
          onPress={() => router.back()}
          className='w-9 h-9 rounded-full bg-neutral-100 items-center justify-center'
        >
          <Feather name='arrow-left' size={18} color='#000' />
        </Pressable>
        <View className='flex-1'>
          <Text className='text-[18px] font-bold text-black'>Ask Penny</Text>
          <Text className='text-[12px] text-neutral-400'>
            {isDataReady
              ? `${transactions.length} transactions loaded`
              : 'Loading your data…'}
          </Text>
        </View>
        {messages.length > 0 && (
          <Pressable
            onPress={() => setMessages([])}
            className='w-9 h-9 rounded-full bg-neutral-100 items-center justify-center'
          >
            <Feather name='trash-2' size={15} color='#A3A3A3' />
          </Pressable>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className='flex-1'
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        {/* Empty state */}
        {messages.length === 0 && (
          <View className='mt-4'>
            <View className='items-center mb-8'>
              <View className='w-16 h-16 rounded-2xl bg-black items-center justify-center mb-4'>
                <Feather name='zap' size={28} color='#fff' />
              </View>
              <Text className='text-[18px] font-bold text-black'>
                Hi, I'm Penny
              </Text>
              <Text className='text-[14px] text-neutral-400 text-center mt-1 px-8'>
                Ask me anything about your finances — spending, trends,
                categories.
              </Text>
            </View>
            <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3'>
              Suggestions
            </Text>
            <View className='gap-2'>
              {SUGGESTED.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => sendMessage(s)}
                  disabled={!isDataReady}
                  className='bg-white rounded-2xl px-4 py-3.5 flex-row items-center justify-between'
                >
                  <Text className='text-[14px] text-black flex-1'>{s}</Text>
                  <Feather name='arrow-right' size={14} color='#A3A3A3' />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Chat messages */}
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`mb-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.role === 'user' ? (
              <View className='bg-black rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]'>
                <Text className='text-white text-[14px] leading-5'>
                  {msg.content}
                </Text>
              </View>
            ) : (
              <View className='bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[92%]'>
                {msg.content ? <MarkdownView content={msg.content} /> : null}
                {msg.streaming && (
                  <View className='flex-row items-center gap-1 mt-1'>
                    <View className='w-1.5 h-1.5 rounded-full bg-neutral-300' />
                    <View className='w-1.5 h-1.5 rounded-full bg-neutral-300' />
                    <View className='w-1.5 h-1.5 rounded-full bg-neutral-300' />
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View className='px-4 pt-3 pb-8 bg-white border-t border-neutral-100 flex-row items-end gap-3'>
        <View className='flex-1 bg-neutral-100 rounded-2xl px-4 py-3 flex-row items-end gap-2 min-h-[48px]'>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={
              isDataReady ? 'Ask about your finances…' : 'Loading data…'
            }
            placeholderTextColor='#A3A3A3'
            className='flex-1 text-[14px] text-black'
            multiline
            maxLength={500}
            editable={isDataReady && !isLoading}
            onSubmitEditing={() => sendMessage(input)}
          />
        </View>
        <Pressable
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || isLoading || !isDataReady}
          className='w-12 h-12 rounded-2xl items-center justify-center'
          style={{
            backgroundColor:
              input.trim() && isDataReady && !isLoading ? '#000' : '#E5E5E5',
          }}
        >
          {isLoading ? (
            <ActivityIndicator size='small' color='#A3A3A3' />
          ) : (
            <Feather
              name='arrow-up'
              size={18}
              color={input.trim() && isDataReady ? '#fff' : '#A3A3A3'}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
