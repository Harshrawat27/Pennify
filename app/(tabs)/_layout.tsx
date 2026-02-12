import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

const TAB_CONFIG: Record<
  string,
  { icon: React.ComponentProps<typeof Feather>['name']; label: string }
> = {
  index: { icon: 'home', label: 'Home' },
  report: { icon: 'bar-chart-2', label: 'Report' },
  plan: { icon: 'clipboard', label: 'Plan' },
  settings: { icon: 'settings', label: 'Settings' },
};

const BUTTON_SIZE = 56;
const GAP = 5;
const CUP_R = BUTTON_SIZE / 2 + GAP;
function getCupPath(w: number, h: number) {
  const cx = w / 2;
  const r = CUP_R;
  // Kappa: magic number to approximate a circle arc with cubic bezier
  const k = 0.5523;

  // Proper semicircle notch using kappa-based quarter-circle arcs
  return [
    `M 0 0`,
    `L ${cx - r} 0`,
    // Quarter circle: top-left of cup → bottom center
    `C ${cx - r} ${r * k}, ${cx - r * k} ${r}, ${cx} ${r}`,
    // Quarter circle: bottom center → top-right of cup
    `C ${cx + r * k} ${r}, ${cx + r} ${r * k}, ${cx + r} 0`,
    `L ${w} 0`,
    `L ${w} ${h}`,
    `L 0 ${h}`,
    `Z`,
  ].join(' ');
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);
  const barContentH = 56;
  const barHeight = barContentH + bottomPad;

  const renderTab = (routeName: string, idx: number) => {
    const route = state.routes[idx];
    if (!route) return null;
    const isFocused = state.index === idx;
    const config = TAB_CONFIG[routeName];
    if (!config) return null;

    return (
      <Pressable
        key={routeName}
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
        className="flex-1 items-center justify-center"
      >
        <Feather
          name={config.icon}
          size={22}
          color={isFocused ? '#000000' : '#A3A3A3'}
        />
        <Text
          className={`mt-1 ${
            isFocused ? 'text-black font-bold' : 'text-neutral-400'
          }`}
          style={{ fontSize: 10 }}
        >
          {config.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: barHeight,
        overflow: 'visible',
        backgroundColor: 'transparent',
      }}
    >
      {/* ── Floating + button ── */}
      <View
        style={{
          position: 'absolute',
          top: -(BUTTON_SIZE / 2),
          left: SCREEN_WIDTH / 2 - BUTTON_SIZE / 2,
          zIndex: 20,
        }}
      >
        <Pressable
          onPress={() => {
            // TODO: Open add expense screen
          }}
        >
          <View
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: BUTTON_SIZE / 2,
              backgroundColor: '#000000',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            <Feather name="plus" size={26} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>

      {/* ── SVG background with cup cutout (transparent behind cup) ── */}
      <Svg
        width={SCREEN_WIDTH}
        height={barHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Path d={getCupPath(SCREEN_WIDTH, barHeight)} fill="#FFFFFF" />
      </Svg>

      {/* ── Tab icons — centered vertically in the bar ── */}
      <View
        className="flex-row items-center"
        style={{ height: barContentH }}
      >
        {renderTab('index', 0)}
        {renderTab('report', 1)}

        {/* Gap for the center button + cup */}
        <View style={{ width: CUP_R * 2 + 8 }} />

        {renderTab('plan', 2)}
        {renderTab('settings', 3)}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent' },
      }}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="report" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
