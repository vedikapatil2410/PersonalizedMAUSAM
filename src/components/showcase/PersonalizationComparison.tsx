/**
 * Phase 21 — Personalization Comparison Component
 * SIH26076 · PersonalizedMAUSAM
 *
 * Side-by-side comparison component demonstrating the core problem solved by SIH26076:
 * Generic raw weather metrics vs. Role-tailored actionable recommendations.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SHOWCASE_COMPARISON_ITEMS } from '../../constants/showcaseScenarios';

export const PersonalizationComparison: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'side_by_side' | 'generic' | 'personalized'>('side_by_side');

  return (
    <View className="bg-slate-800/90 border border-sky-500/40 rounded-2xl p-4 my-4 shadow-sm">
      {/* Title Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Text className="text-base mr-2">⚖️</Text>
          <Text className="text-sm font-bold text-white tracking-tight">
            Generic vs. Personalized Weather
          </Text>
        </View>
        <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
          <Text className="text-[9px] font-bold text-sky-300 uppercase">SIH26076 Demo</Text>
        </View>
      </View>

      <Text className="text-xs text-slate-300 mb-3 leading-4">
        Demonstrates how raw meteorological numbers are transformed into role-specific daily guidance.
      </Text>

      {/* Tab Controls */}
      <View className="bg-slate-900/80 p-1 rounded-xl flex-row mb-3 border border-slate-700/60">
        <TouchableOpacity
          onPress={() => setActiveTab('side_by_side')}
          className={`flex-1 py-1.5 rounded-lg items-center ${
            activeTab === 'side_by_side' ? 'bg-sky-600' : 'bg-transparent'
          }`}
        >
          <Text className={`text-[10px] font-bold ${activeTab === 'side_by_side' ? 'text-white' : 'text-slate-400'}`}>
            Side-by-Side
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('generic')}
          className={`flex-1 py-1.5 rounded-lg items-center ${
            activeTab === 'generic' ? 'bg-slate-700' : 'bg-transparent'
          }`}
        >
          <Text className={`text-[10px] font-bold ${activeTab === 'generic' ? 'text-white' : 'text-slate-400'}`}>
            Generic App
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('personalized')}
          className={`flex-1 py-1.5 rounded-lg items-center ${
            activeTab === 'personalized' ? 'bg-emerald-600' : 'bg-transparent'
          }`}
        >
          <Text className={`text-[10px] font-bold ${activeTab === 'personalized' ? 'text-white' : 'text-slate-400'}`}>
            Personalized MAUSAM
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comparison Content List */}
      <View className="space-y-3">
        {SHOWCASE_COMPARISON_ITEMS.map((item) => (
          <View
            key={item.id}
            className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 mb-2.5"
          >
            {/* Persona Tag */}
            <View className="flex-row items-center mb-1.5">
              <Text className="text-sm mr-1.5">{item.icon}</Text>
              <Text className="text-xs font-bold text-sky-300">{item.personalizedTitle}</Text>
            </View>

            {/* View Modes */}
            {(activeTab === 'side_by_side' || activeTab === 'generic') && (
              <View className="bg-slate-800/80 border border-slate-700/50 rounded-lg p-2 mb-1.5">
                <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Standard Weather App:
                </Text>
                <Text className="text-[11px] text-slate-300">{item.genericText}</Text>
              </View>
            )}

            {(activeTab === 'side_by_side' || activeTab === 'personalized') && (
              <View className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-2">
                <Text className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                  Personalized MAUSAM:
                </Text>
                <Text className="text-[11px] font-semibold text-emerald-200">{item.personalizedText}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Rationale Footer */}
      <View className="mt-2 pt-2 border-t border-slate-700/50">
        <Text className="text-[10px] text-slate-400 leading-4 italic">
          💡 Personalized MAUSAM prioritizes the exact meteorological metrics required by your active roles, eliminating information clutter.
        </Text>
      </View>
    </View>
  );
};
