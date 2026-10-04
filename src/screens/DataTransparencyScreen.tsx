import React, { useMemo } from 'react';
import type { RootStackScreenProps } from '../navigation/types';
import { ScrollView, View, Text } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import { generateDataTransparencySummary } from '../services/dataTransparencyEngine';
import { DataAvailabilityCard } from '../components/transparency/DataAvailabilityCard';
import { PersonalizationSourceCard } from '../components/transparency/PersonalizationSourceCard';
import { ACTIVITY_CATALOG } from '../constants/activities';

/**
 * Data Transparency & Source Center screen.
 * Shows where weather data originates, field availability, personalization pipeline, and safety/alert context.
 */
export const DataTransparencyScreen: React.FC<RootStackScreenProps<'DataTransparency'>> = ({ navigation }) => {
  const { selectedPersonas, selectedPreferences, selectedActivities, selectedLocation } = useApp();
  const { currentWeatherData, dataMode, currentScenarioId } = useWeather();

  // Build input for transparency engine
  const transparencyInput = useMemo(() => ({
    weatherData: currentWeatherData,
    dataMode,
    selectedLocation,
    selectedActivities,
  }), [currentWeatherData, dataMode, selectedLocation, selectedActivities]);

  const summary = useMemo(() => generateDataTransparencySummary(transparencyInput), [transparencyInput]);

  return (
    <ScreenContainer title="Data & Transparency" subtitle="Understand the source of weather data and why recommendations appear" onBack={() => navigation.goBack()}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Source Mode Banner */}
        <View className={`border rounded-xl p-4 mb-4 ${
          summary.dataMode === 'demo'
            ? 'bg-amber-950/40 border-amber-600/60'
            : 'bg-slate-800/80 border-slate-600'
        }`}>
          {summary.dataMode === 'demo' ? (
            <View className="mb-2 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-md self-start">
              <Text className="text-xs font-black text-amber-300">
                Controlled Demo Scenario — Not Live IMD Data
              </Text>
            </View>
          ) : (
            <View className="mb-2 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-md self-start">
              <Text className="text-xs font-black text-emerald-300">
                Official Live IMD Observation Feed
              </Text>
            </View>
          )}
          <Text className="text-sm font-bold text-white mb-1">
            Data Mode: {summary.dataMode === 'live' ? 'Live IMD' : 'Demo Scenario'}
          </Text>
          <Text className="text-xs text-slate-300">Source: {summary.sourceName}</Text>
          {summary.dataMode === 'demo' && summary.scenarioId && (
            <Text className="text-xs text-slate-300 mt-1">Scenario ID: {summary.scenarioId}</Text>
          )}
        </View>

        {/* Weather Field Availability */}
        <View className="mb-4">
          <Text className="text-sm font-bold text-white mb-2">Weather Data Fields</Text>
          {summary.availableFields.map((field, idx) => (
            <DataAvailabilityCard key={`available-${idx}`} field={field} />
          ))}
          {summary.unavailableFields.map((field, idx) => (
            <DataAvailabilityCard key={`unavailable-${idx}`} field={field} />
          ))}
        </View>

        {/* Personalization Pipeline */}
        <PersonalizationSourceCard />

        {/* Phase 26: User-Provided Activity Preferences */}
        <View className="bg-slate-800/80 border border-slate-600 rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-bold text-white">Selected Activities</Text>
            <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
              <Text className="text-[10px] font-bold text-sky-300">USER PREFERENCE</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-300 mb-2.5">
            User-provided activity interests used to prioritize relevant weather windows and impact advisories.
          </Text>
          {selectedActivities.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {selectedActivities.map((actId) => {
                const match = ACTIVITY_CATALOG.find((a) => a.id === actId);
                return (
                  <View
                    key={actId}
                    className="bg-sky-950/70 border border-sky-500/40 rounded-lg px-2.5 py-1 flex-row items-center"
                  >
                    <Text className="text-xs mr-1">{match?.icon || '🎯'}</Text>
                    <Text className="text-xs font-semibold text-sky-200">
                      {match?.title || actId}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text className="text-xs text-slate-400 italic">
              No specific activities selected (Skipped / Default baseline).
            </Text>
          )}
          <Text className="text-[10px] text-slate-400 mt-2.5">
            Source: Explicit user selection during onboarding or profile editing (not external weather data).
          </Text>
        </View>

        {/* Safety Override Status */}
        <View className="bg-slate-800/80 border border-slate-600 rounded-xl p-4 mb-4">
          <Text className="text-sm font-bold text-white mb-1">Safety Override</Text>
          {summary.safetyOverrideActive ? (
            <Text className="text-xs text-red-300">Active – Severe weather conditions prioritize safety over personalization.</Text>
          ) : (
            <Text className="text-xs text-green-300">Inactive – No severe weather detected.</Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};
