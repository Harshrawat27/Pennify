import { View } from 'react-native';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <View className="flex-row gap-1.5 px-6">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`flex-1 h-1 rounded-full ${
            i <= current ? 'bg-black' : 'bg-neutral-200'
          }`}
        />
      ))}
    </View>
  );
}
