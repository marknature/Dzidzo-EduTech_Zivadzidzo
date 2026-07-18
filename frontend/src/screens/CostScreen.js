import React from 'react';
import { Wallet } from 'lucide-react-native';
import PlaceholderScreen from './PlaceholderScreen';

export default function CostScreen() {
  return (
    <PlaceholderScreen
      icon={Wallet}
      title="Cost Monitoring"
      phaseLabel="Coming in Phase 3.5"
      description="Live spend scratchpad across model, human, maintenance, licence, hardware, and other costs, with auto-tracked LLM spend."
    />
  );
}
