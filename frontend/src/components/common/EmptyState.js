import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';

// Ported from ZivaBasa's EmptyState.jsx - the standard "nothing here yet" pattern.
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <View className="items-center justify-center py-12 px-6 gap-3">
      {!!Icon && (
        <View className="w-12 h-12 rounded-full bg-surface2 items-center justify-center mb-1">
          <Icon size={20} color={colors.inkFaint} />
        </View>
      )}
      <Text className="font-display-semibold text-sm text-ink text-center">{title}</Text>
      {!!description && <Text className="text-xs text-ink-muted text-center max-w-xs">{description}</Text>}
      {action}
    </View>
  );
}
