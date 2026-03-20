import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GetStartedProps {
  onNext: () => void;
  onSignIn: () => void;
}

export function GetStarted({ onNext, onSignIn }: GetStartedProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-black justify-between px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 40 }}
    >
      {/* Top: Branding */}
      <View className="items-center mt-20">
        <Image
          source={require('@/assets/images/white-icon.png')}
          style={{ width: 80, height: 80, marginBottom: 24, borderRadius: 20 }}
          resizeMode="contain"
        />
        <Text className="text-white text-[32px] font-bold tracking-tight">
          Spendler
        </Text>
        <Text className="text-neutral-500 text-[16px] mt-2 text-center leading-6">
          Track your money.{'\n'}Build your future.
        </Text>
      </View>

      {/* Bottom: CTA */}
      <View className="gap-4">
        <Pressable
          onPress={onNext}
          className="bg-white rounded-2xl py-4 items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-black text-[16px] font-semibold">
            Get Started
          </Text>
        </Pressable>

        <Pressable onPress={onSignIn}>
          <Text className="text-neutral-500 text-[14px] text-center">
            Already have an account? Sign In
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
