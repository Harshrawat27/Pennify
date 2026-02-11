import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <View className="w-20 h-20 bg-black rounded-full mb-4 items-center justify-center">
          <Text className="text-white text-2xl font-bold">H</Text>
      </View>
      <Text className="text-xl font-bold text-black mb-1">Harsh Rawat</Text>
      <Text className="text-gray-400">harsh@example.com</Text>
      
      <View className="mt-10 w-full px-10">
          <View className="border-t border-gray-100 py-4">
              <Text className="text-black font-medium">Settings</Text>
          </View>
          <View className="border-t border-gray-100 py-4">
              <Text className="text-black font-medium">Export Data</Text>
          </View>
          <View className="border-t border-gray-100 py-4">
              <Text className="text-red-500 font-medium">Log Out</Text>
          </View>
      </View>
    </SafeAreaView>
  );
}
