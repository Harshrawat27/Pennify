import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface MotivationalProps {
  onFinish: () => void;
  onBack: () => void;
}

export function Motivational({ onFinish, onBack }: MotivationalProps) {
  return (
    <View className="flex-1 justify-between">
      <View>
        {/* Back */}
        <View className="px-6 pt-2">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
        </View>

        {/* Content */}
        <View className="items-center px-8 mt-16">
          <View className="w-20 h-20 rounded-3xl bg-black items-center justify-center mb-8">
            <Feather name="check" size={36} color="#fff" />
          </View>

          <Text className="text-[28px] font-bold text-black text-center">
            You're all set!
          </Text>

          <Text className="text-neutral-400 text-[16px] mt-4 text-center leading-6">
            Great choices! Now let's create your account so your data is safely backed up and synced across devices.
          </Text>

          <View className="mt-10 gap-4 w-full">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-neutral-100 items-center justify-center">
                <Feather name="shield" size={18} color="#000" />
              </View>
              <Text className="text-[14px] text-black font-medium flex-1">
                Your data is saved locally
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-neutral-100 items-center justify-center">
                <Feather name="refresh-cw" size={18} color="#000" />
              </View>
              <Text className="text-[14px] text-black font-medium flex-1">
                Sign in to sync across devices
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-neutral-100 items-center justify-center">
                <Feather name="lock" size={18} color="#000" />
              </View>
              <Text className="text-[14px] text-black font-medium flex-1">
                Your data stays private and encrypted
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Continue to Sign In */}
      <View className="px-6 pb-10 pt-4">
        <Pressable
          onPress={onFinish}
          className="py-4 rounded-2xl items-center bg-black"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">
            Create Account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
