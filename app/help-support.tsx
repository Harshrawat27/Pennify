import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className='flex-1 bg-neutral-50'
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      {/* Header */}
      <View className='flex-row items-center px-6 pt-4 pb-2'>
        <Pressable onPress={() => router.back()} className='mr-3'>
          <Feather name='arrow-left' size={22} color='#000' />
        </Pressable>
        <Text className='text-[22px] font-bold text-black tracking-tight'>
          Help & Support
        </Text>
      </View>

      {/* Contact Card */}
      <View className='mx-6 mt-6 bg-white rounded-2xl p-5'>
        <View className='w-12 h-12 rounded-2xl bg-black items-center justify-center mb-4'>
          <Feather name='mail' size={20} color='#fff' />
        </View>
        <Text className='text-[16px] font-bold text-black'>
          Contact Support
        </Text>
        <Text className='text-[13px] text-neutral-500 mt-1 leading-5'>
          Have a question or running into an issue? We're here to help. Send us
          an email and we'll get back to you as soon as possible.
        </Text>
        <Pressable
          onPress={() => Linking.openURL('mailto:support@spendler.app')}
          className='mt-4 bg-black rounded-xl py-3 items-center'
        >
          <Text className='text-white font-semibold text-[14px]'>
            support@spendler.app
          </Text>
        </Pressable>
      </View>

      {/* FAQs */}
      <View className='mx-6 mt-6'>
        <Text className='text-[12px] text-neutral-400 font-semibold uppercase tracking-wider mb-2 ml-1'>
          FAQ
        </Text>
        <View className='bg-white rounded-2xl px-4'>
          {FAQS.map((faq, i) => (
            <View
              key={faq.q}
              className={`py-4 ${i < FAQS.length - 1 ? 'border-b border-neutral-100' : ''}`}
            >
              <Text className='text-[14px] font-semibold text-black'>
                {faq.q}
              </Text>
              <Text className='text-[13px] text-neutral-500 mt-1 leading-5'>
                {faq.a}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const FAQS = [
  {
    q: 'How do I add a transaction?',
    a: 'Tap the + button on the home screen or the bottom tab bar to quickly add a new transaction.',
  },
  {
    q: 'How do I restore my subscription?',
    a: 'Go to the paywall screen and tap "Restore Purchases" to restore a previously purchased subscription.',
  },
  {
    q: 'Is my data backed up?',
    a: 'Yes. All your data is securely synced to the cloud and available across your devices.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Go to Settings → Manage Subscription, or open the App Store → your Apple ID → Subscriptions.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings → Delete Account. This will permanently remove all your data.',
  },
];
