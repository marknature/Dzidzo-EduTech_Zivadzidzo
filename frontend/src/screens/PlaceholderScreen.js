import React from 'react';
import { View, Text } from 'react-native';

// Shared shell for tabs whose real screen lands in a later build phase (see the
// ZivaDzidzo build plan). Keeps the navigator fully wired today without faking
// functionality that doesn't exist yet.
export default function PlaceholderScreen({ icon: Icon, title, phaseLabel, description }) {
  return (
    <View className="flex-1 bg-[#0A0F1D] items-center justify-center px-8">
      {Icon ? <Icon color="#3B82F6" size={36} /> : null}
      <Text className="text-white text-lg font-bold mt-4 text-center">{title}</Text>
      <Text className="text-blue-400 text-xs uppercase tracking-widest mt-1">{phaseLabel}</Text>
      <Text className="text-gray-400 text-sm text-center mt-3 leading-relaxed">{description}</Text>
    </View>
  );
}
