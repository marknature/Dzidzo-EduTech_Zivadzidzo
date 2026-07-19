import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// RN substitute for ZivaBasa's CSS gradient shimmer: a simple opacity pulse on the
// surface2 fill. Visually close enough without pulling in a gradient dependency.
export default function Skeleton({ className = 'h-4 w-full' }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.8, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return <Animated.View className={`bg-surface2 rounded-md ${className}`} style={{ opacity: pulse }} />;
}
