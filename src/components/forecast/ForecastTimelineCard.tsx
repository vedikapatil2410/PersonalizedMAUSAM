/**
 * Phase 16 — Forecast Timeline Card
 * SIH26076 · PersonalizedMAUSAM
 *
 * Displays a single forecast period in the timeline.
 * Respects data availability — nullable fields display as "N/A".
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { ForecastPeriod } from '../../types/forecast';

interface ForecastTimelineCardProps {
  period: ForecastPeriod;
  isNow?: boolean;
  isLiveMode?: boolean;
}

/** Returns a condition emoji from the weather condition type */
const getConditionIcon = (condition: string): string => {
  switch (condition) {
    case 'rain':
      return '🌧️';
    case 'thunderstorm':
      return '⛈️';
    case 'severe':
      return '🚨';
    case 'heat':
      return '☀️';
    case 'partly_cloudy':
      return '⛅';
    case 'cloudy':
      return '☁️';
    case 'fog':
      return '🌫️';
    case 'clear':
    default:
      return '☀️';
  }
};

/** Formats a nullable metric value or returns "N/A" */
const formatNullable = (value: number | null, unit: string): string => {
  if (value === null || value === undefined) return 'N/A';
  return `${value}${unit}`;
};

export const ForecastTimelineCard: React.FC<ForecastTimelineCardProps> = ({
  period,
  isNow = false,
  isLiveMode = false,
}) => {
  const borderColor = isNow
    ? 'border-sky-500/60'
    : period.condition === 'severe'
    ? 'border-red-500/50'
    : 'border-slate-700/60';

  const bgColor = isNow
    ? 'bg-sky-900/30'
    : period.condition === 'severe'
    ? 'bg-red-900/20'
    : 'bg-slate-800/80';

  return (
    <View className={`${bgColor} border ${borderColor} rounded-2xl p-4 mb-3`}>
      {/* Header: Time + Badge */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">{getConditionIcon(period.condition)}</Text>
          <View>
            <Text className="text-sm font-bold text-white">
              {period.displayTime}
            </Text>
            <Text className="text-[10px] text-slate-400 capitalize">
              {period.condition.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {period.badge && (
          <View
            className={`px-2.5 py-1 rounded-full border ${
              period.condition === 'severe'
                ? 'bg-red-500/20 border-red-500/40'
                : isNow
                ? 'bg-sky-500/20 border-sky-400/40'
                : 'bg-slate-700/60 border-slate-600/40'
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                period.condition === 'severe' ? 'text-red-300' : 'text-sky-300'
              }`}
            >
              {period.badge}
            </Text>
          </View>
        )}
      </View>

      {/* Temperature Row */}
      <View className="flex-row items-baseline mb-2">
        <Text className="text-2xl font-extrabold text-white">{period.temperature}°</Text>
        <Text className="text-sm font-bold text-slate-400 ml-0.5">C</Text>
        <Text className="text-xs text-slate-500 ml-2">
          Feels {period.feelsLike}°C
        </Text>
      </View>

      {/* Metrics Grid */}
      <View className="flex-row flex-wrap">
        {/* Humidity — always available */}
        <View className="w-1/3 pr-1 mb-1.5">
          <Text className="text-[9px] font-semibold text-slate-500 uppercase">Humidity</Text>
          <Text className="text-[11px] font-bold text-white">{period.humidity}%</Text>
        </View>

        {/* Wind — always available */}
        <View className="w-1/3 px-0.5 mb-1.5">
          <Text className="text-[9px] font-semibold text-slate-500 uppercase">Wind</Text>
          <Text className="text-[11px] font-bold text-white">
            {period.windSpeed} km/h {period.windDirection}
          </Text>
        </View>

        {/* Rain Probability — nullable */}
        <View className="w-1/3 pl-1 mb-1.5">
          <Text className="text-[9px] font-semibold text-slate-500 uppercase">Rain %</Text>
          <Text className="text-[11px] font-bold text-white">
            {formatNullable(period.rainProbability, '%')}
          </Text>
        </View>

        {/* Rainfall — nullable */}
        <View className="w-1/3 pr-1 mb-1.5">
          <Text className="text-[9px] font-semibold text-slate-500 uppercase">Rainfall</Text>
          <Text className="text-[11px] font-bold text-white">
            {formatNullable(period.rainfall, ' mm')}
          </Text>
        </View>

        {/* UV Index — nullable */}
        <View className="w-1/3 px-0.5 mb-1.5">
          <Text className="text-[9px] font-semibold text-slate-500 uppercase">UV Index</Text>
          <Text className="text-[11px] font-bold text-white">
            {formatNullable(period.uvIndex, '/12')}
          </Text>
        </View>

        {/* Visibility — nullable */}
        <View className="w-1/3 pl-1 mb-1.5">
          <Text className="text-[9px] font-semibold text-slate-500 uppercase">Visibility</Text>
          <Text className="text-[11px] font-bold text-white">
            {formatNullable(period.visibility, ' km')}
          </Text>
        </View>
      </View>

      {/* Personalized Note */}
      {period.personalizedNote && (
        <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 mt-2">
          <Text className="text-[11px] text-sky-200/90 leading-4">
            💡 {period.personalizedNote}
          </Text>
        </View>
      )}

      {/* Live mode unavailability note */}
      {isLiveMode && (
        <Text className="text-[9px] text-slate-500 italic mt-1.5">
          Some forecast metrics may not be available from current IMD feed
        </Text>
      )}
    </View>
  );
};
