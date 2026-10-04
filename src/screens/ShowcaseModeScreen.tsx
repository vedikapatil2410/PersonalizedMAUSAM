/**
 * Phase 21 — SIH Showcase / Demo Story Mode Screen
 * SIH26076 · PersonalizedMAUSAM
 *
 * Dedicated live judge presentation dashboard.
 * Demonstrates role-based weather priority, severe safety overrides,
 * rule explainability, multi-persona comparison, and multi-location context.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import { SHOWCASE_SCENARIOS } from '../constants/showcaseScenarios';
import { ShowcaseScenarioCard } from '../components/showcase/ShowcaseScenarioCard';
import { PersonalizationComparison } from '../components/showcase/PersonalizationComparison';
import { PERSONA_CATALOG } from '../constants/personas';
import type { RootStackScreenProps } from '../navigation/types';
import type { ShowcaseScenario } from '../types/showcase';
import type { UserPersonaType, DemoScenarioId } from '../types';

export const ShowcaseModeScreen: React.FC<RootStackScreenProps<'ShowcaseMode'>> = ({
  navigation,
}) => {
  const {
    selectedPersonas,
    selectedPreferences,
    selectedLocation,
    setPersonas,
    setLocation,
  } = useApp();

  const {
    currentScenarioId,
    setScenario,
    dataMode,
    setDataMode,
  } = useWeather();

  const [multiPersonaTest, setMultiPersonaTest] = useState<UserPersonaType>('fitness');
  const [activeTab, setActiveTab] = useState<'scenarios' | 'comparison' | 'multi_persona'>('scenarios');
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  // One-tap demo execution
  const handleRunScenario = (scenario: ShowcaseScenario) => {
    // 1. Ensure Demo mode is active
    setDataMode('demo');

    // 2. Set the scenario in WeatherContext
    setScenario(scenario.scenarioId);

    // 3. Set the persona in AppContext
    setPersonas([scenario.persona]);

    // 4. Set feedback message & navigate to PersonalizedHome
    setDemoMessage(`Executing scenario: ${scenario.name}`);

    navigation.navigate('PersonalizedHome');
  };

  // Multi-persona instant switcher demo
  const handleTestMultiPersona = (personaId: UserPersonaType) => {
    setMultiPersonaTest(personaId);
    setPersonas([personaId]);
    setDataMode('demo');
    setScenario('HOT_SUNNY');
    navigation.navigate('PersonalizedHome');
  };

  // Reset Showcase state
  const handleResetShowcase = () => {
    setDataMode('demo');
    setScenario('NORMAL');
    setPersonas(['health', 'fitness']);
    setLocation('Pune');
    setDemoMessage('Showcase state reset to defaults.');
  };

  return (
    <ScreenContainer
      title="SIH Showcase Mode"
      subtitle="See how MAUSAM adapts weather information to different people and conditions"
      onBack={() => navigation.goBack()}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header Prototype Badge */}
        <View className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center">
              <Text className="text-base mr-2">🎯</Text>
              <Text className="text-xs font-extrabold text-sky-300 uppercase tracking-wider">
                Judge Demonstration Dashboard
              </Text>
            </View>
            <View className="bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-400/40">
              <Text className="text-[10px] font-extrabold text-amber-300 uppercase">
                DEMO MODE — Controlled Scenarios
              </Text>
            </View>
          </View>
          <Text className="text-xs text-slate-300 leading-4">
            Demonstrates rule-based personalization, severe weather safety overrides, and multi-persona priority changes for SIH Problem Statement SIH26076.
          </Text>
        </View>

        {/* Action Status Banner */}
        {demoMessage && (
          <View className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 mb-4 flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-emerald-300">
              ✓ {demoMessage}
            </Text>
            <TouchableOpacity onPress={() => setDemoMessage(null)}>
              <Text className="text-xs text-slate-400 font-bold">✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Navigation Controls */}
        <View className="bg-slate-800/90 p-1.5 rounded-xl flex-row mb-4 border border-slate-700/80">
          <TouchableOpacity
            onPress={() => setActiveTab('scenarios')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'scenarios' ? 'bg-sky-600' : 'bg-transparent'
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'scenarios' ? 'text-white' : 'text-slate-400'}`}>
              Story Scenarios
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('multi_persona')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'multi_persona' ? 'bg-sky-600' : 'bg-transparent'
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'multi_persona' ? 'text-white' : 'text-slate-400'}`}>
              Multi-Persona
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('comparison')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'comparison' ? 'bg-sky-600' : 'bg-transparent'
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'comparison' ? 'text-white' : 'text-slate-400'}`}>
              Before / After
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* TAB 1: STORY DEMONSTRATION SCENARIOS                                      */}
        {/* ========================================================================= */}
        {activeTab === 'scenarios' && (
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
              Select Scenario to Run Live Demonstration
            </Text>

            {SHOWCASE_SCENARIOS.map((sc) => (
              <ShowcaseScenarioCard
                key={sc.id}
                scenario={sc}
                onRun={() => handleRunScenario(sc)}
              />
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MULTI-PERSONA COMPARISON DEMO                                      */}
        {/* Same weather (39°C Hot), different personas                                */}
        {/* ========================================================================= */}
        {activeTab === 'multi_persona' && (
          <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Multi-Persona Priority Demonstration
              </Text>
              <View className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                <Text className="text-[9px] font-bold text-amber-300">Weather: 39°C Hot</Text>
              </View>
            </View>

            <Text className="text-xs text-slate-300 leading-4 mb-3">
              Tap any persona below to see how identical weather data (39°C Hot) produces completely different recommendation priorities on the homepage.
            </Text>

            <View className="flex-row flex-wrap justify-between mb-3">
              {PERSONA_CATALOG.slice(0, 6).map((p) => {
                const isSelected = multiPersonaTest === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => handleTestMultiPersona(p.id)}
                    activeOpacity={0.7}
                    className={`w-[48%] mb-2.5 p-3 rounded-xl border flex-row items-center justify-between ${
                      isSelected
                        ? 'bg-sky-500/25 border-sky-400'
                        : 'bg-slate-900/60 border-slate-700/50'
                    }`}
                  >
                    <View className="flex-row items-center flex-1 mr-1">
                      <Text className="text-base mr-2">{p.icon}</Text>
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {p.title}
                      </Text>
                    </View>
                    <Text className="text-xs text-sky-400 font-bold">Run →</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BEFORE / AFTER COMPARISON                                          */}
        {/* ========================================================================= */}
        {activeTab === 'comparison' && <PersonalizationComparison />}

        {/* Multi-Location Context Demonstration */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Multi-Location Compatibility
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Locations')}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-bold text-sky-400">Manage Locations →</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-slate-300 leading-4 mb-3">
            Active District: <Text className="font-bold text-white">📍 {selectedLocation}</Text>
          </Text>

          <View className="flex-row justify-between">
            {['Pune', 'Mumbai', 'Delhi'].map((loc) => (
              <TouchableOpacity
                key={loc}
                onPress={() => setLocation(loc)}
                className={`w-[31%] py-2 rounded-xl border items-center ${
                  selectedLocation === loc
                    ? 'bg-sky-500/25 border-sky-400'
                    : 'bg-slate-900/60 border-slate-700/50'
                }`}
              >
                <Text className="text-xs font-bold text-white">📍 {loc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reset Showcase Action Button */}
        <View className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-6">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Demonstration Controls
          </Text>
          <TouchableOpacity
            onPress={handleResetShowcase}
            activeOpacity={0.8}
            accessibilityLabel="Reset showcase demonstration state to default"
            accessibilityRole="button"
            className="bg-slate-700/80 py-3 rounded-xl items-center border border-slate-600/60"
          >
            <Text className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
              ↺ Reset Showcase to Default
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};
