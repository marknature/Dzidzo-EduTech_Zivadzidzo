import React from 'react';
import { MessageCircle } from 'lucide-react-native';
import PlaceholderScreen from './PlaceholderScreen';

export default function ChatScreen() {
  return (
    <PlaceholderScreen
      icon={MessageCircle}
      title="ZivaDzidzo Assistant"
      phaseLabel="Coming in Phase 2"
      description="A tool-using chat assistant with persistent sessions, backed by gpt-4o-mini."
    />
  );
}
