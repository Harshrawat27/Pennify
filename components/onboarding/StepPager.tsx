import { useState, useCallback } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface StepPagerProps {
  children: React.ReactNode[];
  step: number;
}

export function StepPager({ children, step }: StepPagerProps) {
  return (
    <View className="flex-1">
      <Animated.View
        key={step}
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(150)}
        className="flex-1"
      >
        {children[step]}
      </Animated.View>
    </View>
  );
}
