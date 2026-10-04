import type { PersonalizedRecommendation } from '../types/personalization';
import type { WeatherData } from '../types';
import { MAX_VISIBLE_RECOMMENDATIONS } from '../constants/decisionRules';
import { decideRecommendations } from './decisionEngine';

/**
 * Checks whether the current meteorological conditions require a safety override.
 */
export const isSafetyOverrideActive = (weatherData: WeatherData): boolean => {
  return weatherData.severity === 'severe';
};

/**
 * Pure, deterministic Safety Override Engine.
 *
 * Responsibilities:
 * - Positioned downstream of Phase 6 Decision & Priority Engine.
 * - If weather is NOT severe, passes through selectedRecommendations untouched.
 * - If weather IS severe:
 *   1. Guarantees a critical safety alert is placed at index 0.
 *   2. Prevents any duplication of the critical alert card.
 *   3. Bypasses the 4-card normal feed limit by making the critical alert additive
 *      (e.g., 1 critical alert + up to 4 supporting advisories = up to 5 cards).
 *   4. Operates independently of user personas or preference toggles.
 *   5. Preserves supporting advisories underneath the critical safety banner.
 */
export const applySafetyOverride = (
  selectedRecommendations: PersonalizedRecommendation[],
  allRecommendations: PersonalizedRecommendation[] = [],
  weatherData: WeatherData
): PersonalizedRecommendation[] => {
  // 1. Non-severe weather: pass through unmodified
  if (!isSafetyOverrideActive(weatherData)) {
    return selectedRecommendations;
  }

  // 2. Severe weather: Locate or construct critical safety recommendation
  const foundCritical =
    allRecommendations.find((r) => r.priority === 'critical' || r.category === 'safety_alert') ||
    selectedRecommendations.find((r) => r.priority === 'critical' || r.category === 'safety_alert');

  const criticalCard: PersonalizedRecommendation = foundCritical
    ? {
        ...foundCritical,
        priority: 'critical',
        category: 'safety_alert',
      }
    : {
        id: 'critical_severe_weather',
        category: 'safety_alert',
        title: 'Severe Weather Warning',
        description:
          'Hazardous storm conditions active in your district. Postpone non-essential travel, secure outdoor assets, and observe civil defense instructions.',
        priority: 'critical',
        explanation: 'Shown because severe weather conditions are currently active.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Public Safety Priority'],
        weatherTrigger: `Severe Warning • Wind ${weatherData.windSpeed} km/h • Precip ${weatherData.rainfall} mm`,
        icon: '🚨',
        badge: 'Safety Alert',
      };

  // 3. Remove any instance of the critical card from selected recommendations to avoid duplication
  const nonCriticalSelected = selectedRecommendations.filter(
    (r) => r.id !== criticalCard.id && r.priority !== 'critical'
  );

  // 4. Capacity interaction:
  // If selectedRecommendations came from decideRecommendations(allRecommendations) where the critical card
  // took up one of the 4 slots (leaving only 3 normal cards), but allRecommendations has more valid
  // non-critical candidates, restore up to MAX_VISIBLE_RECOMMENDATIONS (4) non-critical cards.
  let normalCards = nonCriticalSelected;
  if (normalCards.length < MAX_VISIBLE_RECOMMENDATIONS && allRecommendations.length > 0) {
    const nonCriticalCandidates = allRecommendations.filter(
      (r) => r.id !== criticalCard.id && r.priority !== 'critical'
    );
    if (nonCriticalCandidates.length > normalCards.length) {
      normalCards = decideRecommendations(nonCriticalCandidates);
    }
  }

  // 5. Prepend the critical card at index 0
  return [criticalCard, ...normalCards];
};
