/**
 * Phase 16 — Activity Details & Suitability Ratings
 * SIH26076 · PersonalizedMAUSAM
 *
 * Persona-specific activity guidance driven by meteorological conditions.
 * Respects data availability — nullable fields display as "N/A".
 * Never fabricates live weather metrics.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useWeather } from '../context/WeatherContext';
import { useApp } from '../context/AppContext';
import { PERSONA_CATALOG } from '../constants/personas';
import { isSafetyOverrideActive } from '../services/safetyOverrideEngine';
import { getDemoForecast, getLiveForecast } from '../constants/demoForecast';
import type { RootStackScreenProps } from '../navigation/types';
import type { ActivityRating, ActivitySuitabilityLevel } from '../types/forecast';
import type { WeatherData } from '../types';

interface ActivityDefinition {
  id: string;
  name: string;
  icon: string;
  personas: string[];
  evaluator: (
    weather: WeatherData,
    isLive: boolean
  ) => {
    level: ActivitySuitabilityLevel;
    label: string;
    bestWindow: string;
    summary: string;
    metrics: { label: string; value: string; isAvailable: boolean }[];
  };
}

const ACTIVITIES: ActivityDefinition[] = [
  {
    id: 'outdoor_running',
    name: 'Outdoor Running & Cardio',
    icon: '🏃',
    personas: ['fitness'],
    evaluator: (w, isLive) => {
      if (w.severity === 'severe') {
        return {
          level: 'hazardous',
          label: 'Hazardous — Do Not Run',
          bestWindow: 'No Safe Window',
          summary: 'Severe weather active. High wind gusts and lightning hazard.',
          metrics: [
            { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
            { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
            { label: 'Rain', value: isLive ? 'N/A' : `${w.rainProbability}%`, isAvailable: !isLive },
          ],
        };
      }
      if (w.temperature >= 38) {
        return {
          level: 'caution',
          label: 'Heat Caution',
          bestWindow: 'Early Morning (5–7 AM) or Post-Sunset',
          summary: 'Extreme heat conditions. Risk of dehydration and heat exhaustion.',
          metrics: [
            { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
            { label: 'Feels', value: `${w.feelsLike}°C`, isAvailable: true },
            { label: 'Humidity', value: `${w.humidity}%`, isAvailable: true },
          ],
        };
      }
      if (w.weatherCondition === 'rain' || w.weatherCondition === 'thunderstorm') {
        return {
          level: 'caution',
          label: 'Wet Conditions',
          bestWindow: 'Post-Rainfall Window',
          summary: 'Slick running surfaces and active precipitation. Indoor cardio recommended.',
          metrics: [
            { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
            { label: 'Rain', value: isLive ? 'N/A' : `${w.rainProbability}%`, isAvailable: !isLive },
            { label: 'Humidity', value: `${w.humidity}%`, isAvailable: true },
          ],
        };
      }
      return {
        level: 'optimal',
        label: 'Optimal Conditions',
        bestWindow: 'Anytime Today',
        summary: 'Comfortable temperatures and moderate humidity. Great running conditions.',
        metrics: [
          { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
          { label: 'Humidity', value: `${w.humidity}%`, isAvailable: true },
          { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
        ],
      };
    },
  },
  {
    id: 'cycling_commute',
    name: 'Cycling & Two-Wheeler Commute',
    icon: '🚴',
    personas: ['fitness', 'commuting'],
    evaluator: (w, isLive) => {
      if (w.severity === 'severe' || w.windSpeed >= 40) {
        return {
          level: 'hazardous',
          label: 'Hazardous — Strong Winds',
          bestWindow: 'Avoid Travel',
          summary: 'Dangerous crosswinds and poor road stability. Use four-wheel or metro transit.',
          metrics: [
            { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
            { label: 'Visibility', value: isLive ? 'N/A' : `${w.visibility} km`, isAvailable: !isLive },
            { label: 'Rain', value: isLive ? 'N/A' : `${w.rainProbability}%`, isAvailable: !isLive },
          ],
        };
      }
      if (w.weatherCondition === 'rain' || w.weatherCondition === 'thunderstorm') {
        return {
          level: 'caution',
          label: 'Slick Roads & Reduced Grip',
          bestWindow: 'After Showers Clear',
          summary: 'Road surfaces have reduced traction. Allow extra braking distance.',
          metrics: [
            { label: 'Rain', value: isLive ? 'N/A' : `${w.rainProbability}%`, isAvailable: !isLive },
            { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
            { label: 'Visibility', value: isLive ? 'N/A' : `${w.visibility} km`, isAvailable: !isLive },
          ],
        };
      }
      return {
        level: 'favorable',
        label: 'Favorable Route Conditions',
        bestWindow: 'Morning & Late Afternoon',
        summary: 'Clear visibility and manageable wind speeds along major corridors.',
        metrics: [
          { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
          { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
          { label: 'Humidity', value: `${w.humidity}%`, isAvailable: true },
        ],
      };
    },
  },
  {
    id: 'outdoor_family_outing',
    name: 'Park Outing & Playground',
    icon: '👨‍👩‍👧‍👦',
    personas: ['family'],
    evaluator: (w, isLive) => {
      if (w.severity === 'severe') {
        return {
          level: 'hazardous',
          label: 'Hazardous — Stay Indoors',
          bestWindow: 'Postpone Outing',
          summary: 'Hazardous weather in effect. Keep children indoors away from loose structures.',
          metrics: [
            { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
            { label: 'Precip', value: isLive ? 'N/A' : `${w.rainfall} mm`, isAvailable: !isLive },
          ],
        };
      }
      if (w.temperature >= 37) {
        return {
          level: 'caution',
          label: 'Excessive Heat for Children',
          bestWindow: 'Evening (After 6:00 PM)',
          summary: 'Playground equipment may become hot. Schedule outdoor play after sunset.',
          metrics: [
            { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
            { label: 'Feels', value: `${w.feelsLike}°C`, isAvailable: true },
            { label: 'UV', value: isLive ? 'N/A' : `${w.uvIndex}/12`, isAvailable: !isLive },
          ],
        };
      }
      if (w.weatherCondition === 'rain') {
        return {
          level: 'caution',
          label: 'Rain Advisory',
          bestWindow: 'Indoor Activities Recommended',
          summary: 'Wet grounds and puddles. Prefer indoor recreational centers.',
          metrics: [
            { label: 'Rain', value: isLive ? 'N/A' : `${w.rainProbability}%`, isAvailable: !isLive },
            { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
          ],
        };
      }
      return {
        level: 'optimal',
        label: 'Optimal Family Weather',
        bestWindow: 'Morning to Early Afternoon',
        summary: 'Mild temperatures and clear skies. Perfect for park visits and picnics.',
        metrics: [
          { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
          { label: 'Humidity', value: `${w.humidity}%`, isAvailable: true },
          { label: 'UV', value: isLive ? 'N/A' : `${w.uvIndex}/12`, isAvailable: !isLive },
        ],
      };
    },
  },
  {
    id: 'field_operations',
    name: 'Crop Spraying & Irrigation',
    icon: '🌾',
    personas: ['agriculture'],
    evaluator: (w, isLive) => {
      if (w.severity === 'severe' || w.windSpeed >= 25) {
        return {
          level: 'hazardous',
          label: 'Spray Drift Hazard',
          bestWindow: 'Postpone Spraying',
          summary: 'Wind speeds cause significant spray drift. High evaporation/washoff risk.',
          metrics: [
            { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
            { label: 'Rain', value: isLive ? 'N/A' : `${w.rainProbability}%`, isAvailable: !isLive },
          ],
        };
      }
      if (w.weatherCondition === 'rain' || (w.rainProbability !== null && w.rainProbability >= 50)) {
        return {
          level: 'caution',
          label: 'Washoff Risk',
          bestWindow: 'Dry Spell Window',
          summary: 'Active or imminent precipitation will wash off foliar applications.',
          metrics: [
            { label: 'Rain', value: isLive ? 'N/A' : `${w.rainProbability}%`, isAvailable: !isLive },
            { label: 'Humidity', value: `${w.humidity}%`, isAvailable: true },
          ],
        };
      }
      return {
        level: 'optimal',
        label: 'Favorable Field Conditions',
        bestWindow: 'Early Morning (Low Wind)',
        summary: 'Calm winds and appropriate humidity for efficient agrochemical application.',
        metrics: [
          { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
          { label: 'Humidity', value: `${w.humidity}%`, isAvailable: true },
          { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
        ],
      };
    },
  },
  {
    id: 'outdoor_gathering',
    name: 'Open-Air Gathering / Event',
    icon: '🎪',
    personas: ['events', 'travel'],
    evaluator: (w, isLive) => {
      if (w.severity === 'severe') {
        return {
          level: 'hazardous',
          label: 'Hazardous — Cancel Outdoor Setup',
          bestWindow: 'Relocate Indoors',
          summary: 'Severe squall warning. Canopies, tents, and sound rigging are at risk.',
          metrics: [
            { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
            { label: 'Precip', value: isLive ? 'N/A' : `${w.rainfall} mm`, isAvailable: !isLive },
          ],
        };
      }
      if (w.weatherCondition === 'rain' || w.weatherCondition === 'thunderstorm') {
        return {
          level: 'caution',
          label: 'Rain Contingency Required',
          bestWindow: 'Covered Venue',
          summary: 'Precipitation active. Ensure waterproof canopies and grounded power lines.',
          metrics: [
            { label: 'Rain', value: isLive ? 'N/A' : `${w.rainProbability}%`, isAvailable: !isLive },
            { label: 'Humidity', value: `${w.humidity}%`, isAvailable: true },
          ],
        };
      }
      return {
        level: 'optimal',
        label: 'Optimal Event Weather',
        bestWindow: 'Full Event Duration',
        summary: 'Pleasant ambient conditions with low precipitation risk.',
        metrics: [
          { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
          { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
          { label: 'Humidity', value: `${w.humidity}%`, isAvailable: true },
        ],
      };
    },
  },
  {
    id: 'sun_exposure',
    name: 'Sun & Skin Exposure',
    icon: '🏖️',
    personas: ['health', 'outdoor'],
    evaluator: (w, isLive) => {
      if (w.severity === 'severe') {
        return {
          level: 'hazardous',
          label: 'Hazardous Environment',
          bestWindow: 'Indoor Shelter',
          summary: 'Severe weather active. Solar exposure is not the primary risk.',
          metrics: [
            { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
            { label: 'Wind', value: `${w.windSpeed} km/h`, isAvailable: true },
          ],
        };
      }
      if (!isLive && w.uvIndex >= 8) {
        return {
          level: 'caution',
          label: 'Very High Solar Radiation',
          bestWindow: 'Early Morning or After 4:30 PM',
          summary: 'Intense UV levels. Apply SPF 50+, wear sunglasses, and limit midday exposure.',
          metrics: [
            { label: 'UV Index', value: `${w.uvIndex}/12`, isAvailable: true },
            { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
          ],
        };
      }
      return {
        level: 'favorable',
        label: 'Moderate Solar Load',
        bestWindow: 'Standard Outdoor Hours',
        summary: 'Standard sun protection adequate for routine outdoor activities.',
        metrics: [
          { label: 'Temp', value: `${w.temperature}°C`, isAvailable: true },
          { label: 'UV Index', value: isLive ? 'N/A' : `${w.uvIndex}/12`, isAvailable: !isLive },
        ],
      };
    },
  },
];

const getSuitabilityStyle = (level: ActivitySuitabilityLevel) => {
  switch (level) {
    case 'optimal':
      return {
        bg: 'bg-emerald-500/15 border-emerald-500/40',
        text: 'text-emerald-300',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
      };
    case 'favorable':
      return {
        bg: 'bg-sky-500/15 border-sky-500/40',
        text: 'text-sky-300',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        dot: 'bg-sky-400',
      };
    case 'caution':
      return {
        bg: 'bg-amber-500/15 border-amber-500/40',
        text: 'text-amber-300',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
      };
    case 'hazardous':
      return {
        bg: 'bg-red-500/15 border-red-500/40',
        text: 'text-red-300',
        badge: 'bg-red-500/20 text-red-300 border-red-500/40',
        dot: 'bg-red-400',
      };
  }
};

export const ActivityDetailsScreen: React.FC<RootStackScreenProps<'ActivityDetails'>> = ({
  navigation,
}) => {
  const { selectedPersonas, selectedLocation } = useApp();
  const { currentWeatherData, dataMode } = useWeather();
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string | null>(null);

  const isLive = dataMode === 'live';
  const safetyActive = isSafetyOverrideActive(currentWeatherData);

  // Evaluate activities
  const ratings: ActivityRating[] = useMemo(() => {
    return ACTIVITIES.map((act) => {
      const evaluation = act.evaluator(currentWeatherData, isLive);
      return {
        id: act.id,
        name: act.name,
        icon: act.icon,
        level: evaluation.level,
        ratingLabel: evaluation.label,
        bestWindow: evaluation.bestWindow,
        summary: evaluation.summary,
        primaryMetrics: evaluation.metrics,
        relevantPersonas: act.personas,
      };
    });
  }, [currentWeatherData, isLive]);

  // Filter by persona
  const displayedRatings = useMemo(() => {
    if (!selectedPersonaFilter) {
      // If user has selected personas, prioritize them
      if (selectedPersonas.length > 0) {
        return ratings.sort((a, b) => {
          const aRelevant = a.relevantPersonas.some((p) => selectedPersonas.includes(p as any));
          const bRelevant = b.relevantPersonas.some((p) => selectedPersonas.includes(p as any));
          if (aRelevant && !bRelevant) return -1;
          if (!aRelevant && bRelevant) return 1;
          return 0;
        });
      }
      return ratings;
    }
    return ratings.filter((r) => r.relevantPersonas.includes(selectedPersonaFilter));
  }, [ratings, selectedPersonaFilter, selectedPersonas]);

  return (
    <ScreenContainer
      title="Activity Details"
      subtitle={`${selectedLocation} • Personalized condition ratings`}
      onBack={() => navigation.goBack()}
    >
      {/* Safety Override Banner */}
      {safetyActive && (
        <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4 flex-row items-center">
          <Text className="text-sm mr-2">🚨</Text>
          <View className="flex-1">
            <Text className="text-xs font-bold text-red-200">
              Severe Weather Override Active
            </Text>
            <Text className="text-[10px] text-red-300/80 mt-0.5">
              Outdoor activities rated hazardous due to active meteorological warning.
            </Text>
          </View>
        </View>
      )}

      {/* Attribution Banner */}
      <View
        className={`rounded-xl p-2.5 mb-4 flex-row items-center justify-between border ${
          isLive
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <View className="flex-row items-center">
          <View
            className={`w-2 h-2 rounded-full mr-2 ${
              isLive ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <Text
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isLive ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {isLive ? 'Live IMD Observation Feed' : 'Prototype Demo Evaluation'}
          </Text>
        </View>
        <Text className="text-[10px] text-slate-400">
          Location: {selectedLocation}
        </Text>
      </View>

      {/* Persona Filter Chips */}
      <View className="mb-4">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Filter by Activity Category
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
              All Activities
            </Text>
          </TouchableOpacity>
          {PERSONA_CATALOG.map((p) => {
            const isUserPersona = selectedPersonas.includes(p.id);
            const isSelected = selectedPersonaFilter === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPersonaFilter(isSelected ? null : p.id)}
                activeOpacity={0.7}
                className={`mr-2 px-2.5 py-1.5 rounded-lg border flex-row items-center ${
                  isSelected
                    ? 'bg-sky-500/25 border-sky-400'
                    : isUserPersona
                    ? 'bg-slate-800/80 border-slate-600/60'
                    : 'bg-slate-800/40 border-slate-700/40'
                }`}
              >
                <Text className="text-xs mr-1">{p.icon}</Text>
                <Text
                  className={`text-[11px] font-medium ${
                    isSelected
                      ? 'text-sky-200 font-bold'
                      : isUserPersona
                      ? 'text-sky-300'
                      : 'text-slate-400'
                  }`}
                >
                  {p.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Activity Rating Cards */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2 px-1">
          <Text className="text-base font-extrabold text-white tracking-tight uppercase">
            Suitability Ratings
          </Text>
          <View className="bg-sky-500/20 px-2.5 py-0.5 rounded-full border border-sky-400/30">
            <Text className="text-[10px] font-bold text-sky-300">
              {displayedRatings.length} Activities
            </Text>
          </View>
        </View>

        {displayedRatings.map((rating) => {
          const style = getSuitabilityStyle(rating.level);
          return (
            <View
              key={rating.id}
              className={`bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-3`}
            >
              {/* Card Header: Icon, Title, Rating Badge */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1 mr-2">
                  <Text className="text-xl mr-2.5">{rating.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-white leading-5">
                      {rating.name}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <View className={`w-2 h-2 rounded-full ${style.dot} mr-1.5`} />
                      <Text className={`text-[11px] font-bold ${style.text}`}>
                        {rating.ratingLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className={`px-2 py-0.5 rounded-full border ${style.badge}`}>
                  <Text className="text-[9px] font-bold uppercase tracking-wider">
                    {rating.level}
                  </Text>
                </View>
              </View>

              {/* Best Window */}
              <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 mb-2.5">
                <Text className="text-[9px] font-semibold text-slate-500 uppercase">
                  Recommended Window
                </Text>
                <Text className="text-xs font-bold text-sky-200 mt-0.5">
                  ⏱️ {rating.bestWindow}
                </Text>
              </View>

              {/* Summary Description */}
              <Text className="text-xs text-slate-300 leading-4 mb-2.5">
                {rating.summary}
              </Text>

              {/* Meteorological Factor Tags */}
              <View className="flex-row flex-wrap">
                {rating.primaryMetrics.map((m, idx) => (
                  <View
                    key={idx}
                    className="bg-slate-900/40 border border-slate-700/40 px-2.5 py-1 rounded-lg mr-2 mb-1"
                  >
                    <Text className="text-[9px] text-slate-400">
                      {m.label}:{' '}
                      <Text
                        className={`font-bold ${
                          m.isAvailable ? 'text-white' : 'text-slate-500 italic'
                        }`}
                      >
                        {m.value}
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Personalization Insights Link */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PersonalizationInsights')}
        activeOpacity={0.7}
        className="bg-slate-800/60 border border-sky-500/20 rounded-xl p-3 mb-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <Text className="text-[10px] mr-1.5">🧠</Text>
          <Text className="text-xs text-sky-300 font-semibold">
            Why are these ratings assigned?
          </Text>
        </View>
        <Text className="text-[10px] font-bold text-sky-400">Insights →</Text>
      </TouchableOpacity>

      {/* Data Integrity Disclaimer */}
      <View className="mt-1 mb-6 px-1">
        <Text className="text-[10px] text-slate-500 text-center font-medium leading-4 italic">
          {isLive
            ? 'Evaluations based on live IMD observation station data • Unavailable parameters marked N/A'
            : 'Prototype demo evaluations • Respects persona-specific threshold logic'}
        </Text>
      </View>
    </ScreenContainer>
  );
};
