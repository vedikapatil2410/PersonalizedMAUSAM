/**
 * Phase 16 — Personalized Forecast & Weather Timeline
 * SIH26076 · PersonalizedMAUSAM
 *
 * Full forecast screen with:
 * - Current conditions header
 * - Forecast timeline (demo mode) or graceful unavailable message (live mode)
 * - Best time window section
 * - Persona filter chips
 * - Safety override banner
 * - Link to alerts and PersonalizationInsights
 * - Data mode + source attribution
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { ForecastTimelineCard } from '../components/forecast/ForecastTimelineCard';
import { useWeather } from '../context/WeatherContext';
import { useApp } from '../context/AppContext';
import { getDemoForecast, getLiveForecast, getBestTimeWindow } from '../constants/demoForecast';
import { PERSONA_CATALOG } from '../constants/personas';
import { isSafetyOverrideActive } from '../services/safetyOverrideEngine';
import { generatePersonalizedAlerts } from '../services/alertEngine';
import type { RootStackScreenProps } from '../navigation/types';
import type { ForecastPeriod } from '../types/forecast';

export const ForecastScreen: React.FC<RootStackScreenProps<'Forecast'>> = ({ navigation }) => {
  const { selectedPersonas, selectedLocation } = useApp();
  const userState = useApp();
  const {
    currentWeatherData,
    currentScenarioId,
    dataMode,
    isLoading,
    error,
  } = useWeather();

  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string | null>(null);

  // Build forecast data
  const forecastData = useMemo(() => {
    if (dataMode === 'demo') {
      return getDemoForecast(currentScenarioId, selectedLocation);
    }
    return getLiveForecast(currentWeatherData, selectedLocation);
  }, [dataMode, currentScenarioId, currentWeatherData, selectedLocation]);

  // Best time window
  const bestTime = useMemo(() => {
    return getBestTimeWindow(forecastData, dataMode === 'demo' ? currentScenarioId : undefined);
  }, [forecastData, currentScenarioId, dataMode]);

  // Safety override check
  const safetyActive = useMemo(() => {
    return isSafetyOverrideActive(currentWeatherData);
  }, [currentWeatherData]);

  // Active alerts count for navigation CTA
  const alertCount = useMemo(() => {
    return generatePersonalizedAlerts({
      weatherData: currentWeatherData,
      userState,
      dataMode,
    }).length;
  }, [currentWeatherData, userState, dataMode]);

  // Filter periods by persona relevance (optional enhancement)
  const filteredPeriods: ForecastPeriod[] = useMemo(() => {
    if (!forecastData.isAvailable) return [];
    // No persona filtering needed on periods — they are universal timeline data
    return forecastData.periods;
  }, [forecastData]);

  // Condition icon for current weather
  const conditionIcon = useMemo(() => {
    switch (currentWeatherData.weatherCondition) {
      case 'rain': return '🌧️';
      case 'thunderstorm': return '⛈️';
      case 'fog': return '🌫️';
      case 'heat': return '☀️';
      case 'partly_cloudy': return '⛅';
      case 'cloudy': return '☁️';
      case 'severe': return '🚨';
      default: return '☀️';
    }
  }, [currentWeatherData.weatherCondition]);

  return (
    <ScreenContainer
      title="Forecast & Timeline"
      subtitle={`${selectedLocation} • Personalized weather outlook`}
      onBack={() => navigation.goBack()}
    >
      {/* Safety Override Banner */}
      {safetyActive && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Alerts')}
          activeOpacity={0.7}
          className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4 flex-row items-center"
        >
          <Text className="text-sm mr-2">🚨</Text>
          <View className="flex-1">
            <Text className="text-xs font-bold text-red-200">
              Safety Override Active — Severe Weather Warning
            </Text>
            <Text className="text-[10px] text-red-300/80 mt-0.5">
              All outdoor activities suspended. Tap to view full alert details.
            </Text>
          </View>
          <Text className="text-[10px] font-bold text-red-300">Alerts →</Text>
        </TouchableOpacity>
      )}

      {/* Data Source Attribution */}
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
            {dataMode === 'live' ? 'Live IMD Observation' : 'Prototype Demo Forecast'}
          </Text>
        </View>
        <Text className="text-[10px] text-slate-400">
          Updated: {forecastData.updatedAt}
        </Text>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3 mb-4 items-center">
          <Text className="text-xs font-semibold text-sky-300">
            ⏳ Loading weather data...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && dataMode === 'live' && (
        <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
          <Text className="text-xs font-bold text-red-400 mb-0.5">⚠️ {error}</Text>
          <Text className="text-[11px] text-slate-400">
            Switch to Demo Mode for prototype forecast simulation.
          </Text>
        </View>
      )}

      {/* Current Conditions Header */}
      <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4">
        <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">
          Current Conditions
        </Text>

        <View className="flex-row items-center justify-between mb-2">
          <View>
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-extrabold text-white">
                {currentWeatherData.temperature}°
              </Text>
              <Text className="text-base font-bold text-slate-400 ml-0.5">C</Text>
            </View>
            <Text className="text-xs text-slate-400 mt-0.5">
              Feels like {currentWeatherData.feelsLike}°C
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-2xl mb-0.5">{conditionIcon}</Text>
            <Text className="text-xs font-semibold text-sky-300 capitalize">
              {currentWeatherData.weatherCondition.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Compact metrics */}
        <View className="flex-row flex-wrap">
          <View className="w-1/3 pr-1">
            <Text className="text-[9px] font-semibold text-slate-500 uppercase">Humidity</Text>
            <Text className="text-[11px] font-bold text-white">{currentWeatherData.humidity}%</Text>
          </View>
          <View className="w-1/3 px-0.5">
            <Text className="text-[9px] font-semibold text-slate-500 uppercase">Wind</Text>
            <Text className="text-[11px] font-bold text-white">
              {currentWeatherData.windSpeed} km/h
            </Text>
          </View>
          <View className="w-1/3 pl-1">
            <Text className="text-[9px] font-semibold text-slate-500 uppercase">Rain</Text>
            <Text className="text-[11px] font-bold text-white">
              {dataMode === 'live' ? 'N/A' : `${currentWeatherData.rainProbability}%`}
            </Text>
          </View>
        </View>

        {/* Summary */}
        <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 mt-2.5">
          <Text className="text-[11px] text-slate-300 leading-4">
            {currentWeatherData.summary}
          </Text>
        </View>
      </View>

      {/* Persona Filter Chips */}
      {selectedPersonas.length > 0 && (
        <View className="mb-4">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Forecast Context — Your Personas
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setSelectedPersonaFilter(null)}
              activeOpacity={0.7}
              className={`mr-2 px-3 py-1.5 rounded-lg border flex-row items-center ${
                selectedPersonaFilter === null
                  ? 'bg-sky-500/25 border-sky-400'
                  : 'bg-slate-800/60 border-slate-700/60'
              }`}
            >
              <Text
                className={`text-[11px] font-medium ${
                  selectedPersonaFilter === null ? 'text-sky-200 font-bold' : 'text-slate-400'
                }`}
              >
                All
              </Text>
            </TouchableOpacity>
            {PERSONA_CATALOG.filter((p) => selectedPersonas.includes(p.id)).map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() =>
                  setSelectedPersonaFilter(selectedPersonaFilter === p.id ? null : p.id)
                }
                activeOpacity={0.7}
                className={`mr-2 px-2.5 py-1.5 rounded-lg border flex-row items-center ${
                  selectedPersonaFilter === p.id
                    ? 'bg-sky-500/25 border-sky-400'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <Text className="text-xs mr-1">{p.icon}</Text>
                <Text
                  className={`text-[11px] font-medium ${
                    selectedPersonaFilter === p.id ? 'text-sky-200 font-bold' : 'text-slate-400'
                  }`}
                >
                  {p.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Forecast Timeline */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2 px-1">
          <Text className="text-base font-extrabold text-white tracking-tight uppercase">
            Forecast Timeline
          </Text>
          {forecastData.isAvailable && (
            <View className="bg-sky-500/20 px-2.5 py-0.5 rounded-full border border-sky-400/30">
              <Text className="text-[10px] font-bold text-sky-300">
                {forecastData.periods.length} Periods
              </Text>
            </View>
          )}
        </View>

        {forecastData.isAvailable && filteredPeriods.length > 0 ? (
          filteredPeriods.map((period, index) => (
            <ForecastTimelineCard
              key={period.id}
              period={period}
              isNow={index === 0}
              isLiveMode={dataMode === 'live'}
            />
          ))
        ) : (
          <View className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 items-center">
            <Text className="text-2xl mb-2">📡</Text>
            <Text className="text-sm font-bold text-white mb-1">
              Forecast Timeline Unavailable
            </Text>
            <Text className="text-xs text-slate-400 text-center leading-5 max-w-xs">
              {forecastData.unavailableReason ||
                'Forecast details are not currently available from the connected IMD feed. Current weather observations remain active.'}
            </Text>
            {dataMode === 'live' && (
              <Text className="text-[10px] text-sky-400 font-semibold mt-2">
                Switch to Demo Mode for prototype forecast simulation
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Best Time Window */}
      <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4">
        <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">
          {bestTime.title}
        </Text>

        {bestTime.isAvailable ? (
          <>
            <Text className="text-sm font-bold text-white mb-1">{bestTime.window}</Text>
            <Text className="text-xs text-slate-300 leading-4">{bestTime.reason}</Text>
          </>
        ) : (
          <View className="flex-row items-center">
            <Text className="text-sm mr-2">—</Text>
            <Text className="text-xs text-slate-400">{bestTime.reason}</Text>
          </View>
        )}
      </View>

      {/* Activity Details CTA */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ActivityDetails')}
        activeOpacity={0.7}
        className="bg-slate-800/80 border border-sky-500/30 rounded-xl p-3.5 mb-4 flex-row items-center justify-between"
      >
        <View className="flex-1 mr-2">
          <Text className="text-xs font-bold text-white mb-0.5">
            🎯 Activity Suitability Ratings
          </Text>
          <Text className="text-[11px] text-slate-400">
            Persona-specific activity guidance based on current and forecast conditions
          </Text>
        </View>
        <View className="bg-sky-500/20 px-2 py-1 rounded-lg border border-sky-400/30">
          <Text className="text-[10px] font-bold text-sky-300">View →</Text>
        </View>
      </TouchableOpacity>

      {/* Alerts CTA */}
      {alertCount > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Alerts')}
          activeOpacity={0.7}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <Text className="text-sm mr-2">⚠️</Text>
            <Text className="text-xs font-bold text-amber-200">
              {alertCount} Active Weather {alertCount === 1 ? 'Alert' : 'Alerts'}
            </Text>
          </View>
          <Text className="text-[10px] font-bold text-amber-300">View Alerts →</Text>
        </TouchableOpacity>
      )}

      {/* Personalization Insights Link */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PersonalizationInsights')}
        activeOpacity={0.7}
        className="bg-slate-800/60 border border-sky-500/20 rounded-xl p-3 mb-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <Text className="text-[10px] mr-1.5">🧠</Text>
          <Text className="text-xs text-sky-300 font-semibold">
            Why this forecast guidance?
          </Text>
        </View>
        <Text className="text-[10px] font-bold text-sky-400">Insights →</Text>
      </TouchableOpacity>

      {/* Data Integrity Disclaimer */}
      <View className="mt-1 mb-6 px-1">
        <Text className="text-[10px] text-slate-500 text-center font-medium leading-4 italic">
          {dataMode === 'live'
            ? 'Official India Meteorological Department (IMD) observation data • Forecast timeline requires forecast endpoint availability'
            : 'Prototype Demo Forecast • Not live IMD data • For engine simulation purposes only'}
        </Text>
      </View>
    </ScreenContainer>
  );
};
