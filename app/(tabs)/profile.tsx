import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-4">
        <Text className="text-2xl font-bold text-black tracking-tight">Profile</Text>
        <Text className="text-sm text-gray-400 mt-1">Your settings</Text>
      </View>
    </View>
  );
}
