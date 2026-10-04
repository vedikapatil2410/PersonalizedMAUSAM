/**
 * Phase 17 — Personalized Daily Weather Briefing Engine
 * SIH26076 · PersonalizedMAUSAM
 *
 * Pure, deterministic, rule-based briefing synthesizer.
 * Answers: "What should I know about today's weather?"
 * Integrates:
 * - Active Location & Label
 * - Live IMD / Demo Weather Observation
 * - ForecastData Timeline (Phase 16)
 * - Personalization Engine recommendations (Phases 5 & 6)
 * - Safety Override state (Phase 7)
 * - Alert Engine alerts (Phase 12)
 *
 * Strict Data Integrity:
 * - Never fabricates live IMD fields
 * - Unavailable live fields remain "N/A"
 * - Clear attribution between Live IMD and Prototype Demo
 */

import type {
  WeatherData,
  WeatherDataMode,
  UserPersonaType,
  WeatherPreferenceType,
  PersonalizedRecommendation,
  WeatherAlert,
} from '../types';
import type { ForecastData } from '../types/forecast';
import type {
  DailyBriefing,
  BriefingMetric,
  BriefingHighlight,
  DailyBriefingSafetyState,
} from '../types/dailyBriefing';

export interface DailyBriefingInput {
  weatherData: WeatherData;
  forecastData?: ForecastData | null;
  selectedPersonas: UserPersonaType[];
  selectedPreferences?: WeatherPreferenceType[];
  recommendations: PersonalizedRecommendation[];
  selectedRecommendations: PersonalizedRecommendation[];
  alerts: WeatherAlert[];
  isSafetyActive?: boolean;
  activeLocationName: string;
  activeLocationLabel?: string;
  dataMode: WeatherDataMode;
}

/**
 * Builds the compact metrics section respecting live vs demo source availability.
 */
function buildKeyMetrics(weatherData: WeatherData, dataMode: WeatherDataMode): BriefingMetric[] {
  const isLive = dataMode === 'live';

  return [
    {
      label: 'Temperature',
      value: `${weatherData.temperature}`,
      unit: '°C',
      available: true,
    },
    {
      label: 'Feels Like',
      value: `${weatherData.feelsLike}`,
      unit: '°C',
      available: true,
    },
    {
      label: 'Humidity',
      value: `${weatherData.humidity}`,
      unit: '%',
      available: true,
    },
    {
      label: 'Wind',
      value: `${weatherData.windSpeed} km/h ${weatherData.windDirection}`,
      unit: '',
      available: true,
    },
    {
      label: 'Rainfall',
      value: isLive ? 'N/A' : `${weatherData.rainfall}`,
      unit: isLive ? '' : ' mm',
      available: !isLive,
    },
    {
      label: 'Rain Probability',
      value: isLive ? 'N/A' : `${weatherData.rainProbability}`,
      unit: isLive ? '' : '%',
      available: !isLive,
    },
    {
      label: 'UV Index',
      value: isLive ? 'N/A' : `${weatherData.uvIndex}`,
      unit: isLive ? '' : '/12',
      available: !isLive,
    },
    {
      label: 'Visibility',
      value: isLive ? 'N/A' : `${weatherData.visibility}`,
      unit: isLive ? '' : ' km',
      available: !isLive,
    },
  ];
}

/**
 * Extracts deterministic timeline insights from ForecastData without fabricating unavailable metrics.
 */
function buildTimelineHighlights(forecastData?: ForecastData | null): string[] {
  if (!forecastData || !forecastData.isAvailable || forecastData.periods.length === 0) {
    return [
      'Forecast details are not currently available from the connected IMD feed. Current weather observations remain active.',
    ];
  }

  const periods = forecastData.periods;
  const highlights: string[] = [];

  // 1. Temperature Range
  const temps = periods.map((p) => p.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  if (minTemp !== maxTemp) {
    highlights.push(
      `Temperature will range between ${minTemp}°C and ${maxTemp}°C across the 12-hour timeline.`
    );
  } else {
    highlights.push(`Temperature will remain steady near ${minTemp}°C.`);
  }

  // 2. Rain peak if available
  const periodsWithRain = periods.filter(
    (p) => p.rainProbability !== null && p.rainProbability !== undefined
  );
  if (periodsWithRain.length > 0) {
    const maxRainPeriod = periodsWithRain.reduce((prev, curr) =>
      (curr.rainProbability ?? 0) > (prev.rainProbability ?? 0) ? curr : prev
    );
    if ((maxRainPeriod.rainProbability ?? 0) >= 50) {
      highlights.push(
        `Precipitation probability peaks at ${maxRainPeriod.rainProbability}% during ${maxRainPeriod.displayTime}.`
      );
    }
  }

  // 3. Peak wind if high
  const maxWindPeriod = periods.reduce((prev, curr) =>
    curr.windSpeed > prev.windSpeed ? curr : prev
  );
  if (maxWindPeriod.windSpeed >= 35) {
    highlights.push(
      `Peak wind gusts reaching ${maxWindPeriod.windSpeed} km/h ${maxWindPeriod.windDirection} expected around ${maxWindPeriod.displayTime}.`
    );
  }

  // 4. Condition transition if changes occur
  const firstCondition = periods[0].condition;
  const changedPeriod = periods.find((p) => p.condition !== firstCondition);
  if (changedPeriod) {
    highlights.push(
      `Weather conditions shift to ${changedPeriod.condition.replace('_', ' ')} around ${changedPeriod.displayTime}.`
    );
  } else if (highlights.length === 1) {
    highlights.push(
      `Stable ${firstCondition.replace('_', ' ')} conditions expected to continue through the day.`
    );
  }

  return highlights;
}

/**
 * Synthesizes personalized highlights by prioritizing existing recommendations
 * and adding persona context supported by existing meteorological conditions.
 */
function buildPersonalizedHighlights(
  selectedRecommendations: PersonalizedRecommendation[],
  recommendations: PersonalizedRecommendation[],
  selectedPersonas: UserPersonaType[],
  weatherData: WeatherData,
  isSafetyActive: boolean
): BriefingHighlight[] {
  const highlights: BriefingHighlight[] = [];
  const seenIds = new Set<string>();

  // 1. Critical recommendation (always first if present)
  const critical =
    selectedRecommendations.find((r) => r.priority === 'critical') ||
    recommendations.find((r) => r.priority === 'critical');

  if (critical) {
    highlights.push({
      id: critical.id,
      category: critical.category,
      title: critical.title,
      description: critical.description,
      priority: 'critical',
      icon: critical.icon || '🚨',
      explanation: critical.explanation,
      badge: critical.badge || 'Critical',
      personaId: critical.relevantPersonas?.[0],
    });
    seenIds.add(critical.id);
  }

  // 2. High priority recommendations from Phase 6 output
  for (const rec of selectedRecommendations) {
    if (rec.priority === 'high' && !seenIds.has(rec.id)) {
      highlights.push({
        id: rec.id,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        priority: 'high',
        icon: rec.icon,
        explanation: rec.explanation,
        badge: rec.badge,
        personaId: rec.relevantPersonas?.[0],
      });
      seenIds.add(rec.id);
    }
  }

  // 3. Medium priority recommendations (if space permits, up to 3 total non-critical)
  for (const rec of selectedRecommendations) {
    if (rec.priority === 'medium' && !seenIds.has(rec.id) && highlights.length < 4) {
      highlights.push({
        id: rec.id,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        priority: 'medium',
        icon: rec.icon,
        explanation: rec.explanation,
        badge: rec.badge,
        personaId: rec.relevantPersonas?.[0],
      });
      seenIds.add(rec.id);
    }
  }

  // 4. If user selected personas but recommendations feed had no card for them,
  // provide deterministic persona guidance supported by actual meteorological conditions
  if (highlights.length < 4 && selectedPersonas.length > 0 && !isSafetyActive) {
    for (const persona of selectedPersonas) {
      if (highlights.length >= 4) break;
      const alreadyHasPersona = highlights.some((h) => h.personaId === persona);
      if (alreadyHasPersona) continue;

      if (persona === 'fitness') {
        if (weatherData.temperature >= 35) {
          highlights.push({
            id: 'briefing_fitness_heat',
            category: 'fitness_window',
            title: 'Fitness: Heat Precaution',
            description: 'Current high temperatures may affect outdoor workout comfort. Hydrate and consider early or indoor workouts.',
            priority: 'medium',
            icon: '🏃',
            explanation: 'Triggered by high temperature for your Fitness persona.',
            badge: 'Fitness Guidance',
            personaId: 'fitness',
          });
        } else if (weatherData.weatherCondition === 'rain' || weatherData.weatherCondition === 'thunderstorm') {
          highlights.push({
            id: 'briefing_fitness_rain',
            category: 'fitness_window',
            title: 'Fitness: Wet Route Advisory',
            description: 'Wet surfaces present reduced grip for outdoor runs. Prefer indoor cardio.',
            priority: 'medium',
            icon: '🏃',
            explanation: 'Triggered by active precipitation for your Fitness persona.',
            badge: 'Fitness Guidance',
            personaId: 'fitness',
          });
        }
      } else if (persona === 'commuting') {
        if (weatherData.weatherCondition === 'rain' || weatherData.windSpeed >= 25) {
          highlights.push({
            id: 'briefing_commuting_weather',
            category: 'commute_impact',
            title: 'Commuting: Transit Alert',
            description: 'Current weather may affect your commute. Allow extra transit time on roads.',
            priority: 'medium',
            icon: '🚆',
            explanation: 'Triggered by wet or windy conditions for your Commuting persona.',
            badge: 'Commute Advisory',
            personaId: 'commuting',
          });
        }
      } else if (persona === 'travel') {
        if (weatherData.weatherCondition === 'rain' || weatherData.weatherCondition === 'fog' || weatherData.windSpeed >= 30) {
          highlights.push({
            id: 'briefing_travel_comfort',
            category: 'travel_visibility',
            title: 'Travel: Journey Comfort',
            description: 'Current conditions may affect travel comfort. Check road and departure updates.',
            priority: 'medium',
            icon: '✈️',
            explanation: 'Triggered by adverse meteorological factors for your Travel persona.',
            badge: 'Travel Notice',
            personaId: 'travel',
          });
        }
      } else if (persona === 'agriculture') {
        if (weatherData.windSpeed >= 25 || weatherData.temperature >= 38) {
          highlights.push({
            id: 'briefing_agri_impact',
            category: 'agri_advisory',
            title: 'Agriculture: Field Planning',
            description: 'Current conditions may affect field or agrochemical spraying schedules.',
            priority: 'medium',
            icon: '🌾',
            explanation: 'Triggered by wind/thermal conditions for your Agriculture persona.',
            badge: 'Agri Advisory',
            personaId: 'agriculture',
          });
        }
      } else if (persona === 'family') {
        if (weatherData.temperature >= 37 || weatherData.weatherCondition === 'rain') {
          highlights.push({
            id: 'briefing_family_routine',
            category: 'family_routine',
            title: 'Family: Routine Planning',
            description: 'Current conditions may affect outdoor family routines. Plan indoor activities.',
            priority: 'medium',
            icon: '👨‍👩‍👧‍👦',
            explanation: 'Triggered by weather comfort factors for your Family persona.',
            badge: 'Family Routine',
            personaId: 'family',
          });
        }
      } else if (persona === 'outdoor') {
        if (weatherData.temperature >= 35 || weatherData.windSpeed >= 25) {
          highlights.push({
            id: 'briefing_outdoor_check',
            category: 'outdoor_advisory',
            title: 'Outdoor: Condition Check',
            description: 'Outdoor conditions should be checked before planning extended activities.',
            priority: 'medium',
            icon: '🏖️',
            explanation: 'Triggered by thermal/wind conditions for Beach & Outdoor persona.',
            badge: 'Outdoor Note',
            personaId: 'outdoor',
          });
        }
      } else if (persona === 'events') {
        if (weatherData.weatherCondition === 'rain' || weatherData.windSpeed >= 30) {
          highlights.push({
            id: 'briefing_events_risk',
            category: 'event_risk',
            title: 'Events: Contingency Planning',
            description: 'Weather conditions may affect outdoor event planning. Arrange sheltered cover.',
            priority: 'medium',
            icon: '🎪',
            explanation: 'Triggered by precipitation/wind for your Events persona.',
            badge: 'Event Advisory',
            personaId: 'events',
          });
        }
      } else if (persona === 'health') {
        if (weatherData.temperature >= 38) {
          highlights.push({
            id: 'briefing_health_heat',
            category: 'health_comfort',
            title: 'Health: Heat Index Precaution',
            description: 'Elevated ambient temperature. Ensure proper hydration and avoid direct sunlight.',
            priority: 'medium',
            icon: '🏥',
            explanation: 'Triggered by high temperature for your Health persona.',
            badge: 'Health Guidance',
            personaId: 'health',
          });
        }
      }
    }
  }

  return highlights;
}

/**
 * Main Pure Deterministic Briefing Synthesizer
 */
export function generateDailyBriefing(input: DailyBriefingInput): DailyBriefing {
  const {
    weatherData,
    forecastData,
    selectedPersonas,
    recommendations,
    selectedRecommendations,
    alerts,
    activeLocationName,
    activeLocationLabel = 'Active Location',
    dataMode,
  } = input;

  const isSevere = weatherData.severity === 'severe' || input.isSafetyActive === true;

  // 1. Safety State
  const safetyState: DailyBriefingSafetyState = {
    isOverrideActive: isSevere,
    criticalWarning: isSevere ? '🚨 Critical Safety Warning Active' : undefined,
    actionRequired: isSevere
      ? 'Severe weather conditions are currently active. Follow official guidance and avoid unnecessary outdoor activity.'
      : undefined,
  };

  // 2. Headline & Summary
  let headline = '';
  let summary = '';

  if (isSevere) {
    headline = '🚨 Critical Safety Warning in Effect';
    summary =
      'Severe weather conditions are currently active in your district. Follow civil defense instructions, secure loose structures, and postpone non-essential travel.';
  } else if (weatherData.weatherCondition === 'heat' || weatherData.temperature >= 38) {
    headline = `High Thermal Load Advisory — ${weatherData.temperature}°C`;
    summary = `Intense afternoon heat expected with feels-like temperature around ${weatherData.feelsLike}°C. Hydrate frequently and minimize peak sun exposure.`;
  } else if (weatherData.weatherCondition === 'rain' || weatherData.weatherCondition === 'thunderstorm') {
    headline = `Active Precipitation & Wet Road Advisory`;
    summary = `Rainy weather prevailing today with high relative humidity (${weatherData.humidity}%). Allow extra travel buffer and carry rain gear.`;
  } else if (dataMode === 'demo' && weatherData.uvIndex >= 8) {
    headline = `Extreme Solar UV Index Advisory`;
    summary = `Clear sky with UV index peaking at ${weatherData.uvIndex} of 12. Protect sensitive skin with broad-spectrum SPF 50+ and wear protective eyewear.`;
  } else {
    headline = `Favorable Meteorological Conditions`;
    summary = `Pleasant and stable ambient conditions across ${activeLocationName}. Current temperature is ${weatherData.temperature}°C with moderate humidity (${weatherData.humidity}%).`;
  }

  // 3. Key Metrics
  const keyMetrics = buildKeyMetrics(weatherData, dataMode);

  // 4. Timeline Highlights
  const timelineHighlights = buildTimelineHighlights(forecastData);

  // 5. Personalized Highlights
  const personalizedHighlights = buildPersonalizedHighlights(
    selectedRecommendations,
    recommendations,
    selectedPersonas,
    weatherData,
    isSevere
  );

  // 6. Data Availability
  const isLive = dataMode === 'live';
  const availableData = isLive
    ? ['Temperature', 'Feels Like', 'Humidity', 'Wind Speed', 'Wind Direction', 'Weather Condition', 'Sun Times']
    : [
        'Temperature',
        'Feels Like',
        'Humidity',
        'Wind Speed',
        'Wind Direction',
        'Rainfall',
        'Rain Probability',
        'UV Index',
        'Visibility',
        'Forecast Timeline',
        'Sun Times',
      ];

  const unavailableData = isLive
    ? ['Rainfall (Obs)', 'Rain Probability', 'UV Index', 'Visibility', 'Forecast Timeline']
    : [];

  const source =
    isLive
      ? 'Official IMD Observation Feed'
      : 'Prototype Demo • Not live IMD data';

  return {
    id: `briefing_${activeLocationName.toLowerCase().replace(/\s+/g, '_')}`,
    locationName: activeLocationName,
    locationLabel: activeLocationLabel,
    dataMode,
    source,
    generatedAt: weatherData.timestamp || 'Today',
    headline,
    summary,
    keyMetrics,
    timelineHighlights,
    personalizedHighlights,
    activeAlerts: alerts,
    safetyState,
    availableData,
    unavailableData,
  };
}
