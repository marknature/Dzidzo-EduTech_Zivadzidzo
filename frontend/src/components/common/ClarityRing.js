import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const COLOR_MAP = { gold: colors.gold, teal: colors.teal, red: colors.red, indigo: colors.indigo };

// Ported from ZivaBasa's ClarityRing.jsx - the platform's one recurring signature shape.
// mode="loading": indeterminate spin. mode="confidence": fills to `value` (0..1),
// spring-ish ease. mode="static": fixed partial arc, used small in nav/branding.
export default function ClarityRing({ mode = 'static', value = 0, size = 56, strokeWidth = 5, color = 'gold', label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeColor = COLOR_MAP[color] || colors.gold;

  const spin = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode === 'loading') {
      spin.setValue(0);
      const loop = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
      );
      loop.start();
      return () => loop.stop();
    }
    return undefined;
  }, [mode, spin]);

  useEffect(() => {
    if (mode === 'confidence') {
      Animated.spring(fill, { toValue: value, useNativeDriver: false, stiffness: 90, damping: 20, mass: 1 }).start();
    }
  }, [mode, value, fill]);

  const rotateStyle = mode === 'loading'
    ? { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }
    : null;

  const animatedStrokeDashoffset = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const staticOffset = mode === 'loading' ? circumference * 0.75 : circumference * 0.4;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={rotateStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.border} strokeWidth={strokeWidth} />
          {mode === 'confidence' ? (
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={animatedStrokeDashoffset}
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          ) : (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={staticOffset}
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          )}
        </Svg>
      </Animated.View>
      {!!label && (
        <View style={{ position: 'absolute' }}>
          <Text className="font-mono text-[10px] text-ink-muted">{label}</Text>
        </View>
      )}
    </View>
  );
}
