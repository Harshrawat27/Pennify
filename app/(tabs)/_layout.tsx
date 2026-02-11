import { Tabs } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_CONFIG: Record<string, { icon: React.ComponentProps<typeof Feather>['name']; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  transactions: { icon: 'list', label: 'Transactions' },
  analytics: { icon: 'bar-chart-2', label: 'Analytics' },
  profile: { icon: 'user', label: 'Profile' },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row bg-white border-t border-gray-200"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            className="flex-1 items-center pt-3 pb-1"
          >
            <Feather
              name={config.icon}
              size={22}
              color={isFocused ? '#000' : '#9CA3AF'}
            />
            <Text
              className={`text-[10px] mt-1 ${
                isFocused ? 'text-black font-semibold' : 'text-gray-400'
              }`}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
