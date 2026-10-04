/**
 * Phase 18 — Adaptive Homepage Layout Engine
 * SIH26076 · PersonalizedMAUSAM
 *
 * Pure, deterministic, rule-based layout synthesizer.
 * Dynamically composes existing features into an adaptive, prioritized homepage.
 *
 * Guarantees:
 * - Safety First: Critical safety card strictly at position 0 during severe weather.
 * - Source of Truth: Reuses Phase 5-17 outputs directly (never duplicates rules).
 * - Maximum 6 primary adaptive cards.
 * - Semantic deduplication (no redundant cards).
 * - Explainable layout reasoning based on actual persona, weather, and safety data.
 */

import type {
  WeatherData,
  WeatherDataMode,
  UserPersonaType,
  WeatherPreferenceType,
  PersonalizedRecommendation,
  WeatherAlert,
} from '../types';
import type { DailyBriefing } from '../types/dailyBriefing';
import type { ForecastData } from '../types/forecast';
import type {
  HomepageCard,
  HomepageCardType,
  HomepageLayout,
} from '../types/homepageLayout';

export interface HomepageLayoutInput {
  activeLocationName: string;
  activeLocationLabel?: string;
  selectedPersonas: UserPersonaType[];
  selectedPreferences?: WeatherPreferenceType[];
  weatherData: WeatherData;
  recommendations: PersonalizedRecommendation[]; // Phase 6/7 final recommendations
  alerts: WeatherAlert[]; // Phase 12 alerts
  dailyBriefing?: DailyBriefing | null; // Phase 17 briefing
  forecastData?: ForecastData | null; // Phase 16 forecast
  isSafetyActive: boolean;
  dataMode: WeatherDataMode;
}

const MAX_PRIMARY_CARDS = 6;

/**
 * Computes deterministic layout explanation
 */
function buildLayoutExplanation(
  isSevere: boolean,
  primaryPersona?: UserPersonaType,
  hasAlerts?: boolean
): string {
  if (isSevere) {
    return 'Your homepage is prioritizing emergency safety advisories because severe storm conditions are currently active in your district.';
  }

  if (primaryPersona === 'fitness') {
    return 'Your homepage is currently prioritizing workout and activity comfort because Fitness is one of your active personas and current weather conditions influence outdoor exercise.';
  }

  if (primaryPersona === 'travel') {
    return 'Your homepage is currently prioritizing travel comfort and transit conditions based on your active Travel persona.';
  }

  if (primaryPersona === 'agriculture') {
    return 'Your homepage is prioritizing field, soil, and spraying conditions based on your active Agriculture persona.';
  }

  if (primaryPersona === 'commuting') {
    return 'Your homepage is prioritizing road and transit impact based on your active Commuting persona.';
  }

  if (primaryPersona === 'family') {
    return 'Your homepage is prioritizing outdoor family routines based on your active Family persona.';
  }

  if (primaryPersona === 'outdoor') {
    return 'Your homepage is prioritizing outdoor conditions and sun exposure based on your active Beach & Outdoor persona.';
  }

  if (primaryPersona === 'events') {
    return 'Your homepage is prioritizing event feasibility and rain risk based on your active Events persona.';
  }

  if (primaryPersona === 'health') {
    return 'Your homepage is prioritizing weather comfort and thermal conditions based on your active Health persona.';
  }

  if (hasAlerts) {
    return 'Your homepage is highlighting active weather alerts to keep you informed of changing meteorological conditions.';
  }

  return 'Your homepage displays balanced meteorological observations and personalized insights based on your selected interests.';
}

/**
 * Main Pure Deterministic Adaptive Homepage Layout Synthesizer
 */
export function generateHomepageLayout(input: HomepageLayoutInput): HomepageLayout {
  const {
    activeLocationName,
    activeLocationLabel = 'Active Location',
    selectedPersonas,
    selectedPreferences = [],
    weatherData,
    recommendations,
    alerts,
    isSafetyActive,
    dataMode,
  } = input;

  const isSevere = weatherData.severity === 'severe' || isSafetyActive;
  const primaryPersona = selectedPersonas[0];
  const candidateCards: HomepageCard[] = [];

  // =========================================================================
  // 1. SAFETY CARD (Strictly Priority 1 / Position 0 when active)
  // =========================================================================
  if (isSevere) {
    candidateCards.push({
      id: 'card_safety',
      type: 'safety',
      title: '🚨 Critical Safety Warning',
      subtitle: `Severe storm active in ${activeLocationName}`,
      priority: 'critical',
      visible: true,
      position: 0,
      reason: 'Severe weather override active in district. Highest priority safety advisory.',
      route: 'Alerts',
      icon: '🚨',
      badge: 'Critical Override',
    });
  }

  // =========================================================================
  // 2. CANDIDATE CARDS (Semantic Deduplication)
  // =========================================================================

  // Weather Summary Card
  candidateCards.push({
    id: 'card_weather_summary',
    type: 'weather_summary',
    title: 'Current Weather Summary',
    subtitle: `${weatherData.temperature}°C • ${weatherData.weatherCondition.replace('_', ' ')}`,
    priority: 'high',
    visible: true,
    position: 0,
    reason: `Current observation data for ${activeLocationName}`,
    route: 'Forecast',
    icon: '⛅',
    badge: dataMode === 'live' ? 'Live IMD' : 'Demo Observation',
  });

  // Daily Briefing Card (Phase 17)
  candidateCards.push({
    id: 'card_daily_briefing',
    type: 'daily_briefing',
    title: "Today's Weather Briefing",
    subtitle: input.dailyBriefing?.headline || 'Daily personalized outlook',
    priority: isSevere ? 'medium' : 'high',
    visible: true,
    position: 0,
    reason: "Synthesizes today's meteorological conditions and personalized advice",
    route: 'DailyBriefing',
    icon: '☀️',
    badge: 'Briefing',
  });

  // Personalized Recommendations Card (Phase 5/6/7)
  if (recommendations.length > 0) {
    const topRec = recommendations[0];
    candidateCards.push({
      id: 'card_personalized_recommendations',
      type: 'personalized_recommendations',
      title: 'Personalized For You',
      subtitle: `${recommendations.length} active ${recommendations.length === 1 ? 'advisory' : 'advisories'}`,
      priority: topRec.priority === 'critical' ? 'critical' : 'high',
      visible: true,
      position: 0,
      reason: `Recommendations tailored to your ${selectedPersonas.join(', ') || 'interests'}`,
      route: 'PersonalizationInsights',
      icon: topRec.icon || '✨',
      badge: `${recommendations.length} Active`,
    });
  }

  // Non-Critical Alerts Card (Phase 12)
  // Deduplication rule: If severe weather safety card is already active, don't create a redundant alerts card
  const nonCriticalAlerts = alerts.filter((a) => a.severity !== 'critical');
  if (alerts.length > 0 && !isSevere) {
    candidateCards.push({
      id: 'card_alerts',
      type: 'alerts',
      title: `${alerts.length} Weather Alert${alerts.length > 1 ? 's' : ''} Active`,
      subtitle: alerts[0]?.title || 'Meteorological warnings',
      priority: alerts.some((a) => a.severity === 'high') ? 'high' : 'medium',
      visible: true,
      position: 0,
      reason: 'Active weather alerts for your district',
      route: 'Alerts',
      icon: '⚠️',
      badge: 'Alerts',
    });
  }

  // Persona-Specific Specialized Cards
  // Fitness -> Activity Card
  if (selectedPersonas.includes('fitness')) {
    candidateCards.push({
      id: 'card_activity',
      type: 'activity',
      title: 'Activity Suitability Ratings',
      subtitle: 'Condition ratings for workout & running',
      priority: 'high',
      visible: true,
      position: 0,
      reason: 'Prioritized for your active Fitness persona',
      route: 'ActivityDetails',
      icon: '🏃',
      badge: 'Fitness',
    });
  }

  // Travel -> Traveler Card
  if (selectedPersonas.includes('travel')) {
    candidateCards.push({
      id: 'card_travel',
      type: 'travel',
      title: 'Traveler Weather Intelligence',
      subtitle: 'Corridor & transit conditions',
      priority: 'high',
      visible: true,
      position: 0,
      reason: 'Prioritized for your active Travel persona',
      route: 'Traveler',
      icon: '✈️',
      badge: 'Travel',
    });
  }

  // Events -> Event Card
  if (selectedPersonas.includes('events')) {
    candidateCards.push({
      id: 'card_event',
      type: 'event',
      title: 'Event Weather Feasibility',
      subtitle: 'Planning conditions for gatherings',
      priority: 'high',
      visible: true,
      position: 0,
      reason: 'Prioritized for your active Events persona',
      route: 'EventPlanner',
      icon: '🎪',
      badge: 'Events',
    });
  }

  // Forecast Timeline Card (Phase 16)
  candidateCards.push({
    id: 'card_forecast',
    type: 'forecast',
    title: 'Forecast & Weather Timeline',
    subtitle: 'Hourly and multi-hour progression',
    priority: selectedPreferences.includes('temperature') || selectedPreferences.includes('rainfall') ? 'high' : 'medium',
    visible: true,
    position: 0,
    reason: 'Hourly forecast timeline projection for your location',
    route: 'Forecast',
    icon: '⏱️',
    badge: 'Timeline',
  });

  // =========================================================================
  // 3. ADAPTIVE PERSONA & PREFERENCE ORDERING WEIGHTS
  // =========================================================================
  const getCardWeight = (card: HomepageCard): number => {
    // Safety always gets absolute top priority
    if (card.type === 'safety') return 1000;

    let score = 0;

    // Base priority score
    if (card.priority === 'critical') score += 500;
    else if (card.priority === 'high') score += 100;
    else if (card.priority === 'medium') score += 50;
    else score += 10;

    // Persona-specific elevation
    if (primaryPersona === 'fitness') {
      if (card.type === 'personalized_recommendations') score += 40;
      if (card.type === 'activity') score += 35;
      if (card.type === 'forecast') score += 20;
      if (card.type === 'daily_briefing') score += 15;
    } else if (primaryPersona === 'travel') {
      if (card.type === 'travel') score += 40;
      if (card.type === 'weather_summary') score += 30;
      if (card.type === 'forecast') score += 25;
      if (card.type === 'alerts') score += 20;
    } else if (primaryPersona === 'agriculture') {
      if (card.type === 'personalized_recommendations') score += 40;
      if (card.type === 'weather_summary') score += 30;
      if (card.type === 'forecast') score += 25;
      if (card.type === 'alerts') score += 20;
    } else if (primaryPersona === 'commuting') {
      if (card.type === 'personalized_recommendations') score += 40;
      if (card.type === 'weather_summary') score += 30;
      if (card.type === 'alerts') score += 25;
      if (card.type === 'forecast') score += 20;
    } else if (primaryPersona === 'family') {
      if (card.type === 'personalized_recommendations') score += 40;
      if (card.type === 'daily_briefing') score += 30;
      if (card.type === 'alerts') score += 25;
      if (card.type === 'forecast') score += 20;
    } else if (primaryPersona === 'outdoor') {
      if (card.type === 'personalized_recommendations') score += 40;
      if (card.type === 'forecast') score += 30;
      if (card.type === 'alerts') score += 20;
      if (card.type === 'daily_briefing') score += 15;
    } else if (primaryPersona === 'events') {
      if (card.type === 'event') score += 40;
      if (card.type === 'personalized_recommendations') score += 35;
      if (card.type === 'forecast') score += 25;
      if (card.type === 'daily_briefing') score += 20;
    } else if (primaryPersona === 'health') {
      if (card.type === 'personalized_recommendations') score += 40;
      if (card.type === 'daily_briefing') score += 30;
      if (card.type === 'weather_summary') score += 25;
      if (card.type === 'alerts') score += 20;
    } else {
      // Default balanced ordering
      if (card.type === 'weather_summary') score += 35;
      if (card.type === 'daily_briefing') score += 30;
      if (card.type === 'personalized_recommendations') score += 25;
      if (card.type === 'forecast') score += 20;
    }

    // Preference-based boosts
    if (selectedPreferences.includes('severe_alerts') && card.type === 'alerts') {
      score += 15;
    }
    if ((selectedPreferences.includes('temperature') || selectedPreferences.includes('rainfall')) && card.type === 'forecast') {
      score += 15;
    }

    return score;
  };

  // Deduplicate by semantic card type
  const uniqueCardsMap = new Map<HomepageCardType, HomepageCard>();
  for (const card of candidateCards) {
    if (!uniqueCardsMap.has(card.type)) {
      uniqueCardsMap.set(card.type, card);
    }
  }

  const distinctCards = Array.from(uniqueCardsMap.values());

  // Sort descending by weight
  distinctCards.sort((a, b) => getCardWeight(b) - getCardWeight(a));

  // Cap at MAX_PRIMARY_CARDS (6)
  const finalCards = distinctCards.slice(0, MAX_PRIMARY_CARDS);

  // If severe weather, GUARANTEE safety card is at index 0
  if (isSevere) {
    const safetyIndex = finalCards.findIndex((c) => c.type === 'safety');
    if (safetyIndex > 0) {
      const [safetyCard] = finalCards.splice(safetyIndex, 1);
      finalCards.unshift(safetyCard);
    }
  }

  // Assign 0-indexed sequential positions
  finalCards.forEach((c, idx) => {
    c.position = idx;
  });

  const explanation = buildLayoutExplanation(isSevere, primaryPersona, alerts.length > 0);

  return {
    cards: finalCards,
    generatedAt: weatherData.timestamp || 'Today',
    activeLocation: activeLocationName,
    activeLocationLabel,
    activePersonas: selectedPersonas,
    activePreferences: selectedPreferences,
    dataMode,
    explanation,
    primaryPersona,
  };
}
