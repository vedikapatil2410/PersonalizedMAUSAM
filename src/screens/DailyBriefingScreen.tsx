/**
 * Phase 17 — Personalized Daily Weather Briefing Screen
 * SIH26076 · PersonalizedMAUSAM
 *
 * Provides a unified, transparent briefing answering:
 * "What should I know about today's weather?"
 *
 * Synthesizes:
 * - Active Location & User Label
 * - Live IMD / Prototype Demo observation
 * - Forecast Timeline highlights
 * - Personalized recommendations (Phases 5 & 6)
 * - Critical Safety Override banner (Phase 7)
 * - Weather Alerts count & summary (Phase 12)
 * - Notification preferences status (Phase 13)
 * - Data Availability transparency grid
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import { generatePersonalizedRecommendations } from '../services/personalizationEngine';
import { decideRecommendations } from '../services/decisionEngine';
import { applySafetyOverride, isSafetyOverrideActive } from '../services/safetyOverrideEngine';
import { generatePersonalizedAlerts } from '../services/alertEngine';
import { getDemoForecast, getLiveForecast } from '../constants/demoForecast';
import { generateDailyBriefing } from '../services/dailyBriefingEngine';
import type { RootStackScreenProps } from '../navigation/types';
import type { BriefingHighlight } from '../types/dailyBriefing';

export const DailyBriefingScreen: React.FC<RootStackScreenProps<'DailyBriefing'>> = ({
  navigation,
}) => {
  const userState = useApp();
  const { selectedLocation, savedLocations, selectedPersonas, selectedPreferences, notificationPreferences } =
    userState;
  const { currentWeatherData, currentScenarioId, dataMode } = useWeather();

  // Find active location label
  const activeLocationObj = savedLocations?.find(
    (loc) => loc.name.toLowerCase() === selectedLocation.toLowerCase() || loc.city.toLowerCase() === selectedLocation.toLowerCase()
  );
  const locationLabel = activeLocationObj ? `${selectedLocation} • ${activeLocationObj.label}` : selectedLocation;

  // Pipeline Step 1: Raw recommendations
  const rawRecommendations = useMemo(() => {
    return generatePersonalizedRecommendations({
      userState,
      weatherData: currentWeatherData,
    });
  }, [userState, currentWeatherData]);

  // Pipeline Step 2: Decision Engine
  const selectedRecommendations = useMemo(() => {
    return decideRecommendations(rawRecommendations);
  }, [rawRecommendations]);

  // Pipeline Step 3: Safety Override
  const finalRecommendations = useMemo(() => {
    return applySafetyOverride(selectedRecommendations, rawRecommendations, currentWeatherData);
  }, [selectedRecommendations, rawRecommendations, currentWeatherData]);

  // Pipeline Step 4: Alerts
  const alerts = useMemo(() => {
    return generatePersonalizedAlerts({
      weatherData: currentWeatherData,
      userState,
      dataMode,
    });
  }, [currentWeatherData, userState, dataMode]);

  // Safety active check
  const safetyActive = isSafetyOverrideActive(currentWeatherData);

  // Forecast data (Phase 16)
  const forecastData = useMemo(() => {
    if (dataMode === 'demo') {
      return getDemoForecast(currentScenarioId, selectedLocation);
    }
    return getLiveForecast(currentWeatherData, selectedLocation);
  }, [dataMode, currentScenarioId, currentWeatherData, selectedLocation]);

  // Briefing Synthesis
  const briefing = useMemo(() => {
    return generateDailyBriefing({
      weatherData: currentWeatherData,
      forecastData,
      selectedPersonas,
      selectedPreferences,
      recommendations: rawRecommendations,
      selectedRecommendations: finalRecommendations,
      alerts,
      isSafetyActive: safetyActive,
      activeLocationName: selectedLocation,
      activeLocationLabel: locationLabel,
      dataMode,
    });
  }, [
    currentWeatherData,
    forecastData,
    selectedPersonas,
    selectedPreferences,
    rawRecommendations,
    finalRecommendations,
    alerts,
    safetyActive,
    selectedLocation,
    locationLabel,
    dataMode,
  ]);

  const hasCriticalAlert = alerts.some((a) => a.severity === 'critical');

  return (
    <ScreenContainer
      title="Today's Weather Briefing"
      subtitle={briefing.locationLabel}
      onBack={() => navigation.goBack()}
    >
      {/* 1. Critical Safety Banner (if severe) */}
      {briefing.safetyState.isOverrideActive && (
        <View className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-1">
            <Text className="text-xl mr-2">🚨</Text>
            <Text className="text-sm font-extrabold text-red-200 uppercase tracking-wider">
              {briefing.safetyState.criticalWarning}
            </Text>
          </View>
          <Text className="text-xs text-red-200/90 leading-5 mb-3">
            {briefing.safetyState.actionRequired}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Alerts')}
            activeOpacity={0.7}
            className="bg-red-500/30 border border-red-500/50 py-2 px-3 rounded-lg self-start"
          >
            <Text className="text-xs font-bold text-red-100">View Active Alerts →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Source Attribution Bar */}
      <View
        className={`rounded-xl p-2.5 mb-4 flex-row items-center justify-between border ${
          dataMode === 'live'
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <View className="flex-row items-center">
          <View
            className={`w-2 h-2 rounded-full mr-2 ${
              dataMode === 'live' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <Text
            className={`text-[10px] font-bold uppercase tracking-wider ${
              dataMode === 'live' ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {dataMode === 'live' ? 'Live IMD Observation' : 'Prototype Demo • Not live IMD data'}
          </Text>
        </View>
        <Text className="text-[10px] text-slate-400">
          Generated: {briefing.generatedAt}
        </Text>
      </View>

      {/* 3. Today's Weather Headline Card */}
      <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4">
        <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
          Today's Meteorological Summary
        </Text>
        <Text className="text-base font-bold text-white mb-1.5">{briefing.headline}</Text>
        <Text className="text-xs text-slate-300 leading-5 mb-3">{briefing.summary}</Text>

        <View className="flex-row items-baseline mb-1">
          <Text className="text-3xl font-extrabold text-white">
            {currentWeatherData.temperature}°
          </Text>
          <Text className="text-base font-bold text-slate-400 ml-0.5">C</Text>
          <Text className="text-xs text-slate-400 ml-2.5">
            Feels like {currentWeatherData.feelsLike}°C • {currentWeatherData.weatherCondition.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* 4. Key Metrics Grid */}
      <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4">
        <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2.5">
          Key Meteorological Metrics
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {briefing.keyMetrics.map((metric, idx) => (
            <View
              key={idx}
              className="w-[48%] bg-slate-900/50 border border-slate-700/40 rounded-xl p-2.5 mb-2"
            >
              <Text className="text-[9px] font-semibold text-slate-400 uppercase">
                {metric.label}
              </Text>
              <Text
                className={`text-xs font-bold mt-0.5 ${
                  metric.available ? 'text-white' : 'text-slate-500 italic'
                }`}
              >
                {metric.value}{metric.unit}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 5. Personalized For You */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2 px-1">
          <Text className="text-base font-extrabold text-white tracking-tight uppercase">
            Personalized For You
          </Text>
          <View className="bg-sky-500/20 px-2.5 py-0.5 rounded-full border border-sky-400/30">
            <Text className="text-[10px] font-bold text-sky-300">
              {briefing.personalizedHighlights.length} Highlights
            </Text>
          </View>
        </View>

        {briefing.personalizedHighlights.length > 0 ? (
          briefing.personalizedHighlights.map((highlight: BriefingHighlight) => (
            <View
              key={highlight.id}
              className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center flex-1 mr-2">
                  <Text className="text-base mr-2">{highlight.icon}</Text>
                  <Text className="text-sm font-bold text-white flex-1">{highlight.title}</Text>
                </View>
                {highlight.badge && (
                  <View
                    className={`px-2 py-0.5 rounded-full border ${
                      highlight.priority === 'critical'
                        ? 'bg-red-500/20 border-red-500/40'
                        : 'bg-sky-500/20 border-sky-400/30'
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-bold uppercase ${
                        highlight.priority === 'critical' ? 'text-red-300' : 'text-sky-300'
                      }`}
                    >
                      {highlight.badge}
                    </Text>
                  </View>
                )}
              </View>

              <Text className="text-xs text-slate-300 leading-4 mb-2.5">
                {highlight.description}
              </Text>

              <View className="flex-row items-center justify-between pt-2 border-t border-slate-700/50">
                <Text className="text-[10px] text-slate-400 flex-1 mr-2 italic">
                  {highlight.explanation}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('PersonalizationInsights')}
                  activeOpacity={0.7}
                  className="bg-sky-500/10 border border-sky-500/25 px-2 py-0.5 rounded"
                >
                  <Text className="text-[10px] font-semibold text-sky-400">Why this? →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 items-center">
            <Text className="text-xs text-slate-400">
              No specific personalized alerts active for current conditions.
            </Text>
          </View>
        )}
      </View>

      {/* 6. Forecast Timeline Highlights */}
      <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
            Forecast Timeline Highlights
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Forecast')}
            activeOpacity={0.7}
          >
            <Text className="text-[10px] font-bold text-sky-400">View Full Timeline →</Text>
          </TouchableOpacity>
        </View>

        {briefing.timelineHighlights.map((hl, idx) => (
          <View key={idx} className="flex-row items-start mb-1.5">
            <Text className="text-sky-400 text-xs mr-2">•</Text>
            <Text className="text-xs text-slate-300 leading-4 flex-1">{hl}</Text>
          </View>
        ))}
      </View>

      {/* 7. Weather Alerts Summary Card */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Alerts')}
        activeOpacity={0.7}
        className={`rounded-2xl p-4 mb-4 border ${
          hasCriticalAlert
            ? 'bg-red-500/20 border-red-500/50'
            : alerts.length > 0
            ? 'bg-amber-500/15 border-amber-500/40'
            : 'bg-slate-800/80 border-slate-700/60'
        }`}
      >
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <Text className="text-base mr-2">
              {hasCriticalAlert ? '🚨' : alerts.length > 0 ? '⚠️' : '✓'}
            </Text>
            <Text
              className={`text-xs font-bold ${
                hasCriticalAlert
                  ? 'text-red-200'
                  : alerts.length > 0
                  ? 'text-amber-200'
                  : 'text-emerald-300'
              }`}
            >
              {hasCriticalAlert
                ? '1 Critical Safety Warning Active'
                : alerts.length > 0
                ? `${alerts.length} Weather ${alerts.length === 1 ? 'Alert' : 'Alerts'} Active`
                : 'No active weather alerts'}
            </Text>
          </View>
          <Text
            className={`text-[10px] font-bold ${
              hasCriticalAlert ? 'text-red-300' : 'text-sky-400'
            }`}
          >
            View Alerts →
          </Text>
        </View>
        <Text className="text-[11px] text-slate-400 mt-1">
          {alerts.length > 0
            ? 'Tap to inspect active warnings, advisory levels, and safety actions.'
            : 'Standard meteorological monitoring active. No safety advisories issued.'}
        </Text>
      </TouchableOpacity>

      {/* 8. Notification Status */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.7}
        className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 mb-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <Text className="text-xs mr-2">{notificationPreferences?.enabled ? '🔔' : '🔕'}</Text>
          <Text className="text-xs text-slate-300">
            {notificationPreferences?.enabled
              ? 'In-app alert delivery enabled'
              : 'Notifications disabled (Critical alerts always delivered)'}
          </Text>
        </View>
        <Text className="text-[10px] font-bold text-sky-400">Configure →</Text>
      </TouchableOpacity>

      {/* 9. Data Availability Transparency Section */}
      <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-6">
        <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">
          Data Availability & Feed Transparency
        </Text>
        <Text className="text-[11px] text-slate-400 mb-2.5">
          {dataMode === 'live'
            ? 'Live observations sourced from connected IMD station. Unavailable parameters are not fabricated.'
            : 'Prototype demo environment for rule verification. All simulation parameters active.'}
        </Text>

        <View className="space-y-1">
          {briefing.availableData.map((item, idx) => (
            <View key={`avail_${idx}`} className="flex-row items-center justify-between py-0.5">
              <Text className="text-xs text-slate-300">{item}</Text>
              <Text className="text-[10px] font-bold text-emerald-400">Available</Text>
            </View>
          ))}
          {briefing.unavailableData.map((item, idx) => (
            <View key={`unavail_${idx}`} className="flex-row items-center justify-between py-0.5">
              <Text className="text-xs text-slate-400">{item}</Text>
              <Text className="text-[10px] font-bold text-slate-500 italic">N/A (Feed Limit)</Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
};
