// src/components/presentation/DemoPresentationStepCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import type { DemoPresentationStep } from '../../types/demoPresentation';

interface DemoPresentationStepCardProps {
  step: DemoPresentationStep;
  totalSteps: number;
}

export const DemoPresentationStepCard: React.FC<DemoPresentationStepCardProps> = ({
  step,
  totalSteps,
}) => {
  return (
    <View
      className="p-5 mb-4 rounded-xl border bg-slate-800/90 border-slate-700/80"
      accessibilityRole="text"
      accessibilityLabel={`Step ${step.stepNumber} of ${totalSteps}: ${step.title}`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="px-2.5 py-0.5 rounded-full bg-sky-950/60 border border-sky-500/30">
          <Text className="text-xs font-semibold text-sky-400">
            STEP {step.stepNumber} OF {totalSteps}
          </Text>
        </View>
        {step.destination !== 'None' && (
          <View className="px-2 py-0.5 rounded bg-slate-700/50">
            <Text className="text-xs text-slate-300 font-mono">Target: {step.destination}</Text>
          </View>
        )}
      </View>

      <Text className="text-xl font-bold text-white tracking-tight mb-2">
        {step.title}
      </Text>

      <Text className="text-sm text-slate-300 leading-5 mb-3">
        {step.description}
      </Text>

      {step.notice && (
        <View className="p-3 bg-sky-900/20 border border-sky-600/30 rounded-lg">
          <Text className="text-xs font-semibold text-sky-300 uppercase mb-0.5">
            Key Judge Takeaway
          </Text>
          <Text className="text-xs text-slate-300 leading-4">{step.notice}</Text>
        </View>
      )}

      {(step.persona || step.weatherScenario || step.location) && (
        <View className="mt-3 pt-3 border-t border-slate-700/40 flex-row flex-wrap gap-2">
          {step.persona && (
            <View className="px-2 py-0.5 rounded bg-indigo-950/50 border border-indigo-500/30">
              <Text className="text-xs text-indigo-300">Persona: {step.persona}</Text>
            </View>
          )}
          {step.weatherScenario && (
            <View className="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30">
              <Text className="text-xs text-amber-300">Scenario: {step.weatherScenario}</Text>
            </View>
          )}
          {step.location && (
            <View className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30">
              <Text className="text-xs text-emerald-300">Location: {step.location}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
