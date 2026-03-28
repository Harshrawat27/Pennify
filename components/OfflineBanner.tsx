import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

function OfflineIllustration() {
  return (
    <Svg width={52} height={52} viewBox="0 0 52 52">
      {/* Amber circle background */}
      <Circle cx={26} cy={26} r={24} fill="#FEF3C7" />

      {/* WiFi dot */}
      <Circle cx={26} cy={34} r={2.5} fill="#92400E" />
      {/* WiFi small arc */}
      <Path
        d="M21 29 Q26 24 31 29"
        stroke="#92400E"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      {/* WiFi medium arc */}
      <Path
        d="M17 25 Q26 17 35 25"
        stroke="#B45309"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      {/* WiFi large arc */}
      <Path
        d="M13 21 Q26 10 39 21"
        stroke="#D97706"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />

      {/* Red X across the whole thing */}
      <Line
        x1={13} y1={12} x2={39} y2={38}
        stroke="#EF4444"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Line
        x1={39} y1={12} x2={13} y2={38}
        stroke="#EF4444"
        strokeWidth={3.5}
        strokeLinecap="round"
      />

      {/* Subtle border ring */}
      <Circle cx={26} cy={26} r={24} fill="none" stroke="#FDE68A" strokeWidth={1.5} />
    </Svg>
  );
}

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  // null = still detecting, don't flash banner; true = online, hide banner
  if (isOnline !== false) return null;

  return (
    <View className="mx-4 mt-2 mb-1 bg-amber-50 rounded-2xl p-4 flex-row items-center gap-3">
      <OfflineIllustration />
      <View className="flex-1">
        <Text className="text-[14px] font-bold text-amber-900">
          Lost in the void 🌌
        </Text>
        <Text className="text-[12px] text-amber-700 mt-1 leading-[17px]">
          No signal detected — but relax! You can still add transactions. They'll sync automatically when you're back online.
        </Text>
      </View>
    </View>
  );
}
