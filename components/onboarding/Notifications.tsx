import { Alert, Linking, Pressable, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';
import { requestNotificationPermission } from '@/lib/utils/notifications';

interface NotificationsProps {
  onNext: () => void;
  onBack: () => void;
}

export function Notifications({ onNext, onBack }: NotificationsProps) {
  const notificationsEnabled = useOnboardingStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useOnboardingStore((s) => s.setNotificationsEnabled);
  const dailyReminder = useOnboardingStore((s) => s.dailyReminder);
  const setDailyReminder = useOnboardingStore((s) => s.setDailyReminder);
  const weeklyReport = useOnboardingStore((s) => s.weeklyReport);
  const setWeeklyReport = useOnboardingStore((s) => s.setWeeklyReport);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
      } else {
        // Permission denied — guide user to settings
        Alert.alert(
          'Notifications Blocked',
          'Please enable notifications for Pennify in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  return (
    <View className="flex-1 justify-between">
      <View>
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-white items-center justify-center mb-4">
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text className="text-[28px] font-bold text-black">
            Stay on track
          </Text>
          <Text className="text-neutral-400 text-[15px] mt-2">
            Set up reminders to help you stay consistent.
          </Text>
        </View>

        {/* Toggle options */}
        <View className="mx-6 mt-4 gap-3">
          {/* Master toggle */}
          <View className="bg-white rounded-2xl p-5 flex-row items-center">
            <View className="w-12 h-12 rounded-2xl bg-neutral-100 items-center justify-center">
              <Feather name="bell" size={22} color="#000" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-[16px] font-semibold text-black">Notifications</Text>
              <Text className="text-[13px] text-neutral-400 mt-1">
                Enable push notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#E5E5E5', true: '#000' }}
              thumbColor="#fff"
            />
          </View>

          {/* Daily reminder */}
          <View className={`bg-white rounded-2xl p-5 flex-row items-center ${!notificationsEnabled ? 'opacity-40' : ''}`}>
            <View className="w-12 h-12 rounded-2xl bg-neutral-100 items-center justify-center">
              <Feather name="clock" size={22} color="#000" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-[16px] font-semibold text-black">Daily Reminder</Text>
              <Text className="text-[13px] text-neutral-400 mt-1">
                Remind me to log expenses every evening
              </Text>
            </View>
            <Switch
              value={dailyReminder && notificationsEnabled}
              onValueChange={setDailyReminder}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#E5E5E5', true: '#000' }}
              thumbColor="#fff"
            />
          </View>

          {/* Weekly report */}
          <View className={`bg-white rounded-2xl p-5 flex-row items-center ${!notificationsEnabled ? 'opacity-40' : ''}`}>
            <View className="w-12 h-12 rounded-2xl bg-neutral-100 items-center justify-center">
              <Feather name="bar-chart-2" size={22} color="#000" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-[16px] font-semibold text-black">Weekly Report</Text>
              <Text className="text-[13px] text-neutral-400 mt-1">
                Get a summary of your spending each week
              </Text>
            </View>
            <Switch
              value={weeklyReport && notificationsEnabled}
              onValueChange={setWeeklyReport}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#E5E5E5', true: '#000' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* Continue */}
      <View className="px-6 pb-10 pt-4">
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl items-center bg-black"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white font-bold text-[16px]">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
