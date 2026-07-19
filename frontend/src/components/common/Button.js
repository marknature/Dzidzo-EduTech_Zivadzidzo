import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

// Ported from ZivaBasa's Button.jsx. No framer-motion "magnetic hover" (that's a
// pointer/desktop concept) - Pressable's pressed-state opacity dip is the RN equivalent.
const VARIANTS = {
  primary: { container: 'bg-teal', text: 'text-bg font-body-semibold' },
  secondary: { container: 'bg-surface2 border border-border', text: 'text-ink font-body-semibold' },
  ghost: { container: 'bg-transparent', text: 'text-ink-muted font-body-semibold' },
  danger: { container: 'bg-red/10 border border-red/25', text: 'text-red font-body-semibold' },
};

export default function Button({ variant = 'primary', children, disabled, loading, className = '', onPress, ...props }) {
  const { container, text } = VARIANTS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center gap-2 rounded-xl px-4 py-3 ${container} ${(disabled || loading) ? 'opacity-40' : ''} ${className}`}
      style={({ pressed }) => (pressed && !disabled && !loading ? { opacity: 0.8 } : undefined)}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#0B0F17' : '#EDEFF5'} size="small" />
      ) : (
        typeof children === 'string' ? <Text className={`text-sm ${text}`}>{children}</Text> : children
      )}
    </Pressable>
  );
}
