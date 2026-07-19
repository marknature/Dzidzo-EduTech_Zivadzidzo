import React from 'react';
import { View } from 'react-native';

// Ported from ZivaBasa's Card.jsx. No framer-motion/entrance animation here (RN has no
// direct equivalent installed yet) - just the surface/border/radius grammar, which is the
// part reused everywhere else in the app.
export default function Card({ children, className = '', ...props }) {
  return (
    <View className={`bg-surface border border-border rounded-2xl p-5 ${className}`} {...props}>
      {children}
    </View>
  );
}
