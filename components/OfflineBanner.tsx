import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

function SatelliteIllustration() {
  return (
    <Svg width={88} height={68} viewBox="0 0 88 68">
      {/* Stars */}
      <Circle cx={4} cy={6} r={1.5} fill="#FDE68A" opacity={0.8} />
      <Circle cx={14} cy={2} r={1} fill="#FDE68A" opacity={0.6} />
      <Circle cx={76} cy={10} r={1.5} fill="#FDE68A" opacity={0.8} />
      <Circle cx={84} cy={3} r={1} fill="#FDE68A" opacity={0.6} />
      <Circle cx={80} cy={58} r={1.5} fill="#FDE68A" opacity={0.7} />
      <Circle cx={6} cy={56} r={1} fill="#FDE68A" opacity={0.5} />
      <Circle cx={22} cy={64} r={1.2} fill="#FDE68A" opacity={0.6} />
      <Circle cx={70} cy={62} r={1} fill="#FDE68A" opacity={0.5} />

      {/* Left solar panel */}
      <Rect x={6} y={28} width={20} height={12} rx={2} fill="#1D4ED8" />
      <Line x1={11} y1={28} x2={11} y2={40} stroke="#3B82F6" strokeWidth={0.8} />
      <Line x1={16} y1={28} x2={16} y2={40} stroke="#3B82F6" strokeWidth={0.8} />
      <Line x1={21} y1={28} x2={21} y2={40} stroke="#3B82F6" strokeWidth={0.8} />
      {/* Left panel connector */}
      <Rect x={26} y={32} width={6} height={4} rx={1} fill="#4B5563" />

      {/* Right solar panel */}
      <Rect x={62} y={28} width={20} height={12} rx={2} fill="#1D4ED8" />
      <Line x1={67} y1={28} x2={67} y2={40} stroke="#3B82F6" strokeWidth={0.8} />
      <Line x1={72} y1={28} x2={72} y2={40} stroke="#3B82F6" strokeWidth={0.8} />
      <Line x1={77} y1={28} x2={77} y2={40} stroke="#3B82F6" strokeWidth={0.8} />
      {/* Right panel connector */}
      <Rect x={56} y={32} width={6} height={4} rx={1} fill="#4B5563" />

      {/* Satellite body */}
      <Rect x={32} y={22} width={24} height={24} rx={4} fill="#374151" />
      {/* Screen */}
      <Rect x={35} y={25} width={18} height={14} rx={2} fill="#111827" />
      {/* Sad face on screen */}
      <Circle cx={40} cy={30} r={1.8} fill="#FDE68A" />
      <Circle cx={48} cy={30} r={1.8} fill="#FDE68A" />
      <Path
        d="M40 35 Q44 32.5 48 35"
        stroke="#FDE68A"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />

      {/* Antenna */}
      <Line x1={44} y1={22} x2={44} y2={10} stroke="#6B7280" strokeWidth={2} strokeLinecap="round" />
      <Circle cx={44} cy={8} r={3.5} fill="#EF4444" />
      <Circle cx={44} cy={8} r={1.5} fill="#FCA5A5" />

      {/* Broken signal arcs left */}
      <Path
        d="M37 16 Q30 10 32 3"
        stroke="#4B5563"
        strokeWidth={1.8}
        fill="none"
        strokeDasharray="2.5 2"
        strokeLinecap="round"
      />
      {/* Broken signal arcs right */}
      <Path
        d="M51 16 Q58 10 56 3"
        stroke="#4B5563"
        strokeWidth={1.8}
        fill="none"
        strokeDasharray="2.5 2"
        strokeLinecap="round"
      />

      {/* X marks on broken signals */}
      <Line x1={28} y1={1} x2={35} y2={6} stroke="#EF4444" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={35} y1={1} x2={28} y2={6} stroke="#EF4444" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={53} y1={1} x2={60} y2={6} stroke="#EF4444" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={60} y1={1} x2={53} y2={6} stroke="#EF4444" strokeWidth={1.8} strokeLinecap="round" />

      {/* Shadow under satellite */}
      <Path
        d="M34 48 Q44 52 54 48"
        stroke="#1F2937"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline !== false) return null;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 4,
        backgroundColor: '#0F172A',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <SatelliteIllustration />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#F9FAFB', fontWeight: '700', fontSize: 15, letterSpacing: -0.3 }}>
          Lost in the void 🌌
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 5, lineHeight: 18 }}>
          No signal detected — but relax! You can still add transactions. They'll sync when you're back online.
        </Text>
      </View>
    </View>
  );
}
