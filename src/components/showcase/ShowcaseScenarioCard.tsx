/**
 * Phase 21 — Showcase Scenario Card Component
 * SIH26076 · PersonalizedMAUSAM
 *
 * Interactive card component for live judge demonstration scenarios.
 * Displays scenario metadata, persona focus, weather triggers, expected changes,
 * and a one-tap execution button.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ShowcaseScenario } from '../../types/showcase';

interface ShowcaseScenarioCardProps {
  scenario: ShowcaseScenario;
  onRun: () => void;
}

export const ShowcaseScenarioCard: React.FC<ShowcaseScenarioCardProps> = ({
  scenario,
  onRun,
}) => {
  const { name, personaTitle, personaIcon, weatherSummary, expectedChanges, reason, icon, isSevere } = scenario;

  const borderColor = isSevere
    ? 'border-red-500/60'
    : 'border-sky-500/40';

  const bgColor = isSevere
    ? 'bg-red-950/30'
    : 'bg-slate-800/90';

  return (
    <View className={`${bgColor} border ${borderColor} rounded-2xl p-4 mb-4 shadow-sm`}>
      {/* Header: Icon, Name, Persona Pill */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <Text className="text-2xl mr-2.5">{icon}</Text>
          <View className="flex-1">
            <Text className="text-sm font-bold text-white tracking-tight leading-5">
              {name}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Text className="text-[11px] text-slate-400 mr-1.5">Persona:</Text>
              <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30 flex-row items-center">
                <Text className="text-[10px] mr-1">{personaIcon}</Text>
                <Text className="text-[10px] font-bold text-sky-300">{personaTitle}</Text>
              </View>
            </View>
          </View>
        </View>

        {isSevere && (
          <View className="bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/40">
            <Text className="text-[9px] font-extrabold text-red-300 uppercase">
              Safety Override
            </Text>
          </View>
        )}
      </View>

      {/* Weather Trigger Summary */}
      <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 mb-2.5">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
          Trigger Weather Condition
        </Text>
        <Text className="text-xs font-semibold text-sky-200">{weatherSummary}</Text>
      </View>

      {/* Expected Homepage Changes */}
      <View className="mb-2">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
          Demonstration Outcome
        </Text>
        <Text className="text-xs text-slate-200 leading-4">{expectedChanges}</Text>
      </View>

      {/* Rule Rationale */}
      <View className="mb-3">
        <Text className="text-[10px] text-slate-400 leading-3 italic">
          💡 {reason}
        </Text>
      </View>

      {/* Run Scenario Button */}
      <TouchableOpacity
        onPress={onRun}
        activeOpacity={0.8}
        accessibilityLabel={`Run ${name} scenario demonstration`}
        accessibilityRole="button"
        className={`w-full py-2.5 rounded-xl items-center justify-center border ${
          isSevere
            ? 'bg-red-500/20 border-red-500/50'
            : 'bg-sky-500/20 border-sky-400/40'
        }`}
      >
        <Text
          className={`text-xs font-extrabold uppercase tracking-wider ${
            isSevere ? 'text-red-300' : 'text-sky-300'
          }`}
        >
          Run Scenario →
        </Text>
      </TouchableOpacity>
    </View>
  );
};
