// src/components/reliability/DemoReadinessCard.tsx
import React from 'react';
import { View, Text } from 'react-native';

interface DemoReadinessCardProps {
  title: string;
  description?: string;
  passed: boolean;
}

export const DemoReadinessCard: React.FC<DemoReadinessCardProps> = ({
  title,
  description,
  passed,
}) => {
  return (
    <View
      className="p-4 mb-3 rounded-xl border bg-slate-800/80 border-slate-700/60 flex-row items-center justify-between"
      accessibilityRole="text"
      accessibilityLabel={`${title}, Status: ${passed ? 'Verified Ready' : 'Warning Not Ready'}`}
    >
      <View className="flex-1 mr-3">
        <Text className="text-base font-semibold text-white tracking-tight">{title}</Text>
        {description && (
          <Text className="text-xs text-slate-400 mt-1 leading-4">{description}</Text>
        )}
      </View>
      <View
        className={`px-2.5 py-1 rounded-full flex-row items-center ${
          passed ? 'bg-emerald-950/60 border border-emerald-500/30' : 'bg-amber-950/60 border border-amber-500/30'
        }`}
      >
        <Text className="text-sm mr-1">{passed ? '✓' : '⚠️'}</Text>
        <Text
          className={`text-xs font-semibold ${
            passed ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          {passed ? 'READY' : 'CHECK'}
        </Text>
      </View>
    </View>
  );
};
