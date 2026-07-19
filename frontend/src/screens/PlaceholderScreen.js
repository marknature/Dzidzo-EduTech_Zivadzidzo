import React from 'react';
import { View } from 'react-native';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';

// Shared shell for tabs whose real screen lands in a later build phase (see the
// ZivaDzidzo build plan). Keeps the navigator fully wired today without faking
// functionality that doesn't exist yet.
export default function PlaceholderScreen({ icon, title, phaseLabel, description }) {
  return (
    <View className="flex-1 bg-bg items-center justify-center px-8">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={<Badge tone="indigo" className="mt-1">{phaseLabel}</Badge>}
      />
    </View>
  );
}
