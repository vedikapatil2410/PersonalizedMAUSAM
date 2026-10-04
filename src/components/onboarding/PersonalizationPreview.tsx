/**
 * Phase 20 — Personalization Preview Component
 * SIH26076 · PersonalizedMAUSAM
 *
 * Dynamic preview component that demonstrates how user setup selections
 * (location, personas, preferences) shape the adaptive homepage layout.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { PERSONA_CATALOG } from '../../constants/personas';
import { PREFERENCE_CATALOG } from '../../constants/preferences';
import type { UserPersonaType, WeatherPreferenceType } from '../../types';

interface PersonalizationPreviewProps {
  selectedLocation: string;
  selectedPersonas: UserPersonaType[];
  selectedPreferences: WeatherPreferenceType[];
}

export const PersonalizationPreview: React.FC<PersonalizationPreviewProps> = ({
  selectedLocation,
  selectedPersonas,
  selectedPreferences,
}) => {
  // Map selected personas to titles & icons
  const activePersonaObjs = selectedPersonas
    .map((pId) => PERSONA_CATALOG.find((p) => p.id === pId))
    .filter(Boolean);

  // Map selected preferences to titles & icons
  const activePrefObjs = selectedPreferences
    .map((prefId) => PREFERENCE_CATALOG.find((p) => p.id === prefId))
    .filter(Boolean);

  // Generate dynamic prioritization messages based on actual selections
  const getPrioritizationBullets = () => {
    const bullets: { icon: string; title: string; desc: string }[] = [];

    if (selectedPersonas.includes('fitness')) {
      bullets.push({
        icon: '🏃',
        title: 'Fitness & Workout Guidance',
        desc: 'Prioritizes outdoor exercise condition ratings & temperature comfort.',
      });
    }

    if (selectedPersonas.includes('travel')) {
      bullets.push({
        icon: '✈️',
        title: 'Traveler Transit Intelligence',
        desc: 'Prioritizes transit corridor weather & travel comfort indices.',
      });
    }

    if (selectedPersonas.includes('events')) {
      bullets.push({
        icon: '🎪',
        title: 'Event Feasibility Ratings',
        desc: 'Prioritizes rain risk assessment & outdoor event feasibility.',
      });
    }

    if (selectedPersonas.includes('agriculture')) {
      bullets.push({
        icon: '🌾',
        title: 'Agricultural Field Outlook',
        desc: 'Prioritizes rainfall projection, wind speed & spraying windows.',
      });
    }

    if (selectedPersonas.includes('commuting')) {
      bullets.push({
        icon: '🚗',
        title: 'Commute Transit Conditions',
        desc: 'Prioritizes road visibility, rain timeline & commute advisories.',
      });
    }

    if (selectedPersonas.includes('family')) {
      bullets.push({
        icon: '👨‍👩‍👧',
        title: 'Family Daily Briefing',
        desc: 'Prioritizes routine safety highlights & daily weather outlook.',
      });
    }

    if (selectedPersonas.includes('outdoor')) {
      bullets.push({
        icon: '🏖️',
        title: 'Outdoor & Beach Guidance',
        desc: 'Prioritizes UV index alerts, sun times & outdoor comfort.',
      });
    }

    if (selectedPersonas.includes('health')) {
      bullets.push({
        icon: '🌡️',
        title: 'Health & Comfort Insights',
        desc: 'Prioritizes thermal stress, humidity & weather sensitivity rules.',
      });
    }

    if (bullets.length === 0) {
      bullets.push({
        icon: '⛅',
        title: 'General Weather Intelligence',
        desc: 'Displays balanced meteorological observations & general safety advisories.',
      });
    }

    return bullets;
  };

  const bullets = getPrioritizationBullets();

  return (
    <View className="bg-slate-800/90 border border-sky-500/40 rounded-2xl p-4 my-4 shadow-lg shadow-black/30">
      {/* Header Badge */}
      <View className="flex-row items-center justify-between mb-3 border-b border-slate-700/60 pb-2.5">
        <View className="flex-row items-center">
          <Text className="text-base mr-2">👁️</Text>
          <Text className="text-xs font-extrabold text-sky-300 uppercase tracking-wider">
            Personalization Preview
          </Text>
        </View>
        <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
          <Text className="text-[9px] font-bold text-sky-300 uppercase">
            Rule-Based System
          </Text>
        </View>
      </View>

      {/* Selections Summary Grid */}
      <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 mb-3">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Active Setup Context
          </Text>
          <Text className="text-[10px] font-semibold text-sky-400">
            📍 {selectedLocation}
          </Text>
        </View>

        {/* Selected Personas Pills */}
        <View className="mb-2">
          <Text className="text-[9px] text-slate-400 uppercase mb-1">Active Personas:</Text>
          <View className="flex-row flex-wrap">
            {activePersonaObjs.length > 0 ? (
              activePersonaObjs.map((p) => (
                <View
                  key={p!.id}
                  className="bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 rounded-md mr-1.5 mb-1 flex-row items-center"
                >
                  <Text className="text-[10px] mr-1">{p!.icon}</Text>
                  <Text className="text-[10px] font-bold text-sky-200">{p!.title}</Text>
                </View>
              ))
            ) : (
              <Text className="text-[10px] text-slate-400 italic">None selected (General Public)</Text>
            )}
          </View>
        </View>

        {/* Selected Preferences Pills */}
        <View>
          <Text className="text-[9px] text-slate-400 uppercase mb-1">Active Preferences:</Text>
          <View className="flex-row flex-wrap">
            {activePrefObjs.length > 0 ? (
              activePrefObjs.map((pref) => (
                <View
                  key={pref!.id}
                  className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md mr-1.5 mb-1 flex-row items-center"
                >
                  <Text className="text-[10px] mr-1">{pref!.icon}</Text>
                  <Text className="text-[10px] font-medium text-slate-300">{pref!.title}</Text>
                </View>
              ))
            ) : (
              <Text className="text-[10px] text-slate-400 italic">None selected</Text>
            )}
          </View>
        </View>
      </View>

      {/* Dynamic Homepage Output Projection */}
      <Text className="text-xs font-bold text-white mb-2 tracking-tight">
        Your homepage will prioritize:
      </Text>

      <View className="space-y-2 mb-3">
        {bullets.map((b, idx) => (
          <View
            key={`bullet-${idx}`}
            className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-2.5 flex-row items-start mb-1.5"
          >
            <Text className="text-base mr-2">{b.icon}</Text>
            <View className="flex-1">
              <Text className="text-xs font-bold text-sky-200">{b.title}</Text>
              <Text className="text-[11px] text-slate-300 leading-4">{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* How Personalization Works Architecture Flow */}
      <View className="pt-2 border-t border-slate-700/50">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          How Personalization Works
        </Text>
        <Text className="text-[10px] text-slate-300 leading-4 mb-1.5">
          Your selections → Current weather → Rule-based engine → Relevant recommendations → Personalized homepage
        </Text>
        <Text className="text-[9px] text-sky-400/90 italic leading-3">
          ✓ Deterministic, explainable rules. No artificial AI guesses or hidden filters.
        </Text>
      </View>
    </View>
  );
};
