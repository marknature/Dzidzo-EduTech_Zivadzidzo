import React from 'react';
import { View, Text } from 'react-native';

// Ported from ZivaBasa's Badge.jsx: every tone is a 10%-opacity fill + solid text +
// 25%-opacity border of the same hue - keep that formula if adding new tones.
const TONES = {
  gold: 'bg-gold/10 border-gold/25',
  teal: 'bg-teal/10 border-teal/25',
  red: 'bg-red/10 border-red/25',
  indigo: 'bg-indigo/10 border-indigo/25',
  neutral: 'bg-surface2 border-border',
};

const TEXT_TONES = {
  gold: 'text-gold',
  teal: 'text-teal',
  red: 'text-red',
  indigo: 'text-indigo',
  neutral: 'text-ink-muted',
};

export default function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <View className={`flex-row items-center self-start px-2 py-0.5 rounded-full border ${TONES[tone]} ${className}`}>
      <Text className={`text-[11px] font-body-semibold uppercase tracking-wide ${TEXT_TONES[tone]}`}>{children}</Text>
    </View>
  );
}
