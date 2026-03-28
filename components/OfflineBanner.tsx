import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline !== false) return null;

  return (
    <View className='mx-4 mt-2 mb-1 bg-black rounded-xl px-4 py-2.5 flex-row items-center gap-2'>
      <Feather name='wifi-off' size={13} color='#fff' />
      <Text className='text-white text-[12px] font-medium'>
        No internet — you can still add transactions
      </Text>
    </View>
  );
}
