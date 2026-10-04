import React from 'react';
import { View, Text } from 'react-native';

/**
 * Visual static description of the deterministic personalization pipeline.
 * Uses simple vertical layout with arrows to illustrate flow.
 */
export const PersonalizationSourceCard: React.FC = () => {
  return (
    <View className="bg-slate-800/80 border border-slate-600 rounded-xl p-4 mb-4" accessible accessibilityLabel="Personalization pipeline overview">
      <Text className="text-sm font-bold text-white mb-2">Personalization Pipeline</Text>
      <View className="flex-col space-y-2">
        <Text className="text-xs text-slate-300">User Selections → Weather Context</Text>
        <Text className="text-xs text-slate-500 text-center">⬇️</Text>
        <Text className="text-xs text-slate-300">Rule‑Based Personalization Engine</Text>
        <Text className="text-xs text-slate-500 text-center">⬇️</Text>
        <Text className="text-xs text-slate-300">Decision Engine (ranking)</Text>
        <Text className="text-xs text-slate-500 text-center">⬇️</Text>
        <Text className="text-xs text-slate-300">Safety Override Engine (if severe)</Text>
        <Text className="text-xs text-slate-500 text-center">⬇️</Text>
        <Text className="text-xs text-slate-300">Alert Engine → Notification Engine</Text>
        <Text className="text-xs text-slate-500 text-center">⬇️</Text>
        <Text className="text-xs text-slate-300">Homepage Cards</Text>
      </View>
    </View>
  );
};
