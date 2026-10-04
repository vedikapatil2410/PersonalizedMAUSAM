// src/screens/JudgeEvaluationScreen.tsx
/**
 * Phase 23 – Judge Evaluation Mode Screen
 * Provides a deterministic, structured evaluation of the personalization pipeline.
 * The UI shows a disclaimer (re‑using Phase 22 language), a list of pre‑defined
 * evaluation scenarios, and result cards with deterministic evidence.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import { evaluateScenarios } from '../services/evaluationEngine';
import { EvaluationScenario } from '../types/evaluation';
import { PERSONA_CATALOG } from '../constants/personas';
import { demoWeatherScenarios } from '../constants/demoScenarios'; // placeholder
import { RootStackScreenProps } from '../navigation/types';

// Pre‑defined evaluation scenarios – reusing existing demo scenarios & personas
const predefinedScenarios: EvaluationScenario[] = [
  {
    id: 'health_normal',
    persona: 'health',
    weatherScenario: 'NORMAL',
    preferences: [],
    location: 'Pune',
  },
  {
    id: 'fitness_hot',
    persona: 'fitness',
    weatherScenario: 'HOT_SUNNY',
    preferences: [],
    location: 'Mumbai',
  },
  {
    id: 'travel_rainy',
    persona: 'travel',
    weatherScenario: 'RAINY',
    preferences: [],
    location: 'Delhi',
  },
  {
    id: 'high_uv',
    persona: 'outdoor',
    weatherScenario: 'HIGH_UV',
    preferences: [],
    location: 'Pune',
  },
  {
    id: 'severe_weather',
    persona: 'family',
    weatherScenario: 'SEVERE_WEATHER',
    preferences: [],
    location: 'Mumbai',
  },
];

export const JudgeEvaluationScreen: React.FC<RootStackScreenProps<'JudgeEvaluation'>> = ({ navigation }) => {
  const { selectedPersonas, setPersonas, selectedLocation, setLocation, selectedPreferences, setPreferences } =
    useApp();
  const { setScenario, setDataMode } = useWeather();

  const [results, setResults] = useState<any>(null);
  const [running, setRunning] = useState<boolean>(false);

  // Run all predefined scenarios deterministically
  const runEvaluation = async () => {
    setRunning(true);
    // Ensure demo mode
    setDataMode('demo');
    // Evaluate each scenario
    const evaluation = evaluateScenarios(predefinedScenarios);
    setResults(evaluation);
    setRunning(false);
  };

  const resetEvaluation = () => {
    setResults(null);
    // Do NOT modify saved locations, preferences, or live data
    // Reset UI to current app state only
  };

  // Render a simple disclaimer banner using Phase 22 wording
  const Disclaimer = () => (
    <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 mb-4">
      <Text className="text-xs font-bold text-amber-300">Controlled prototype evaluation using deterministic demo scenarios.</Text>
      <Text className="text-[10px] text-slate-300 mt-1">
        Results are based on deterministic prototype scenarios, not statistical production benchmarks.
      </Text>
    </View>
  );

  return (
    <ScreenContainer title="Judge Evaluation Mode" subtitle="Structured, deterministic evidence of personalization" onBack={() => navigation.goBack()}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Disclaimer />
        <TouchableOpacity
          onPress={runEvaluation}
          activeOpacity={0.7}
          accessibilityLabel="Run all evaluation scenarios"
          accessibilityRole="button"
          className="bg-sky-500/15 border border-sky-500/40 rounded-2xl p-4 mb-4 flex-row items-center justify-between"
        >
          <Text className="text-sm font-bold text-sky-300">Run Evaluation</Text>
          {running && <Text className="text-xs text-slate-400">Running…</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={resetEvaluation}
          activeOpacity={0.7}
          accessibilityLabel="Reset evaluation results"
          accessibilityRole="button"
          className="bg-red-500/15 border border-red-500/40 rounded-2xl p-4 mb-4 flex-row items-center justify-between"
        >
          <Text className="text-sm font-bold text-red-300">Reset Evaluation</Text>
        </TouchableOpacity>
        {results && (
          <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-slate-400 mb-2">Evaluation Summary</Text>
            {/* Simple deterministic overview */}
            <Text className="text-xs text-slate-300">Total Recommendations: {results.totals.totalRecommendations}</Text>
            <Text className="text-xs text-slate-300">Safety Overrides Active: {results.totals.safetyOverrideActive ? 'YES' : 'NO'}</Text>
            <Text className="text-xs text-slate-300">Ordering Changed: {results.totals.homepageOrderingChanged ? 'YES' : 'NO'}</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};
