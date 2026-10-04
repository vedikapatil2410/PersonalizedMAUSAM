/**
 * Phase 19 — Personalized Contextual Quick Action Engine
 * SIH26076 · PersonalizedMAUSAM
 *
 * Pure, deterministic, rule-based contextual action synthesizer.
 * Transforms existing personalized weather information and app state
 * into immediately accessible, relevant user actions.
 *
 * Guarantees:
 * - Safety First: Critical safety action is strictly position 0 during severe weather.
 * - Reuses Source of Truth: Consumes outputs from existing engines directly.
 * - Maximum 5 contextual actions.
 * - Deduplication by route / action type.
 * - Explainable "Why this?" rationale.
 * - Deterministic, testable mapping.
 */

import type { UserPersonaType, WeatherPreferenceType, WeatherDataMode, WeatherData } from '../types';
import type { ContextualAction, ContextualActionInput, ContextualActionType } from '../types/contextualActions';

const MAX_CONTEXTUAL_ACTIONS = 5;

/**
 * Main Pure Deterministic Contextual Action Synthesizer
 */
export function generateContextualActions(input: ContextualActionInput): ContextualAction[] {
  const {
    activeLocationName,
    selectedPersonas,
    selectedPreferences = [],
    weatherData,
    recommendations,
    alerts,
    isSafetyActive,
    dataMode,
  } = input;

  const isSevere = weatherData.severity === 'severe' || isSafetyActive;
  const candidateActions: ContextualAction[] = [];

  // =========================================================================
  // 1. CRITICAL SAFETY ACTION (Strictly Priority 1 / Position 0 when active)
  // =========================================================================
  if (isSevere) {
    candidateActions.push({
      id: 'action_safety',
      type: 'safety',
      title: 'View Safety Alerts',
      subtitle: `Critical severe weather active in ${activeLocationName}`,
      icon: '🚨',
      priority: 'critical',
      reason: `Shown because severe weather override is active in ${activeLocationName}.`,
      route: 'Alerts',
      critical: true,
      visible: true,
    });
  }

  // =========================================================================
  // 2. ACTIVE ALERTS ACTION (Non-Critical)
  // =========================================================================
  if (alerts.length > 0 && !isSevere) {
    candidateActions.push({
      id: 'action_alerts',
      type: 'alerts',
      title: `${alerts.length} Weather Alert${alerts.length > 1 ? 's' : ''}`,
      subtitle: alerts[0]?.title || 'IMD weather warnings active',
      icon: '⚠️',
      priority: 'high',
      reason: `Shown because there are ${alerts.length} active weather alert(s) for ${activeLocationName}.`,
      route: 'Alerts',
      critical: false,
      visible: true,
    });
  }

  // =========================================================================
  // 3. PERSONA-SPECIFIC ACTIONS
  // =========================================================================

  // Fitness Persona -> Activity Details
  if (selectedPersonas.includes('fitness')) {
    candidateActions.push({
      id: 'action_fitness',
      type: 'activity',
      title: 'Check Activity Conditions',
      subtitle: 'Workout & outdoor exercise suitability',
      icon: '🏃',
      priority: 'high',
      reason: 'Shown because Fitness is one of your selected personas.',
      route: 'ActivityDetails',
      critical: false,
      visible: true,
    });
  }

  // Travel Persona -> Traveler
  if (selectedPersonas.includes('travel')) {
    candidateActions.push({
      id: 'action_travel',
      type: 'travel',
      title: 'Plan Around Weather',
      subtitle: 'Transit corridor & travel comfort intelligence',
      icon: '✈️',
      priority: 'high',
      reason: 'Shown because Travel is one of your selected personas.',
      route: 'Traveler',
      critical: false,
      visible: true,
    });
  }

  // Events Persona -> Event Planner
  if (selectedPersonas.includes('events')) {
    candidateActions.push({
      id: 'action_events',
      type: 'event',
      title: 'Check Event Feasibility',
      subtitle: 'Gathering rain risk & outdoor feasibility',
      icon: '🎪',
      priority: 'high',
      reason: 'Shown because Events is one of your selected personas.',
      route: 'EventPlanner',
      critical: false,
      visible: true,
    });
  }

  // Agriculture Persona -> Forecast / Crop conditions
  if (selectedPersonas.includes('agriculture')) {
    candidateActions.push({
      id: 'action_agriculture',
      type: 'forecast',
      title: 'Check Field & Soil Outlook',
      subtitle: 'Hourly rain & wind timeline for agriculture',
      icon: '🌾',
      priority: 'high',
      reason: 'Shown because Agriculture is one of your selected personas.',
      route: 'Forecast',
      critical: false,
      visible: true,
    });
  }

  // Commuting Persona -> Forecast / Transit Route
  if (selectedPersonas.includes('commuting')) {
    candidateActions.push({
      id: 'action_commuting',
      type: 'forecast',
      title: 'Check Commute Route Weather',
      subtitle: 'Road visibility & transit weather timeline',
      icon: '🚗',
      priority: 'high',
      reason: 'Shown because Commuting is one of your selected personas.',
      route: 'Forecast',
      critical: false,
      visible: true,
    });
  }

  // Family Persona -> Daily Briefing
  if (selectedPersonas.includes('family')) {
    candidateActions.push({
      id: 'action_family',
      type: 'daily_briefing',
      title: 'View Family Weather Briefing',
      subtitle: 'Daily routine & outdoor safety summary',
      icon: '👨‍👩‍👧',
      priority: 'high',
      reason: 'Shown because Family is one of your selected personas.',
      route: 'DailyBriefing',
      critical: false,
      visible: true,
    });
  }

  // Beach & Outdoor Persona -> Activity Details
  if (selectedPersonas.includes('outdoor')) {
    candidateActions.push({
      id: 'action_outdoor',
      type: 'activity',
      title: 'Check Outdoor & Sun Guidance',
      subtitle: 'UV index & beach condition ratings',
      icon: '🏖️',
      priority: 'high',
      reason: 'Shown because Beach & Outdoor is one of your selected personas.',
      route: 'ActivityDetails',
      critical: false,
      visible: true,
    });
  }

  // Health Persona -> Insights / Comfort
  if (selectedPersonas.includes('health')) {
    candidateActions.push({
      id: 'action_health',
      type: 'insights',
      title: 'Check Health & Comfort Rules',
      subtitle: 'Thermal comfort & weather sensitivity insights',
      icon: '🌡️',
      priority: 'high',
      reason: 'Shown because Health is one of your selected personas.',
      route: 'PersonalizationInsights',
      critical: false,
      visible: true,
    });
  }

  // =========================================================================
  // 4. WEATHER-TRIGGERED CONTEXTUAL ACTIONS (Respecting metric availability)
  // =========================================================================

  // High UV action (only if metric is valid and available)
  if (
    dataMode === 'demo' &&
    weatherData.uvIndex !== null &&
    weatherData.uvIndex !== undefined &&
    weatherData.uvIndex >= 8
  ) {
    candidateActions.push({
      id: 'action_weather_uv',
      type: 'activity',
      title: 'Protect From High UV',
      subtitle: `UV Index is high (${weatherData.uvIndex}) in ${activeLocationName}`,
      icon: '☀️',
      priority: 'high',
      reason: `Shown because current UV index is high (${weatherData.uvIndex}).`,
      route: 'ActivityDetails',
      critical: false,
      visible: true,
    });
  }

  // Heavy Rain / Thunderstorm action
  if (
    weatherData.weatherCondition === 'rain' ||
    weatherData.weatherCondition === 'thunderstorm' ||
    (dataMode === 'demo' && weatherData.rainfall !== null && weatherData.rainfall > 5)
  ) {
    candidateActions.push({
      id: 'action_weather_rain',
      type: 'forecast',
      title: 'Check Rain Timeline',
      subtitle: 'Hourly precipitation projection',
      icon: '🌧️',
      priority: 'high',
      reason: `Shown because rain or thunderstorm is active in ${activeLocationName}.`,
      route: 'Forecast',
      critical: false,
      visible: true,
    });
  }

  // =========================================================================
  // 5. BASE CONTEXTUAL ACTIONS (Forecast, Ask MAUSAM, Locations, Insights)
  // =========================================================================

  // Forecast Action
  candidateActions.push({
    id: 'action_forecast_base',
    type: 'forecast',
    title: 'View Detailed Forecast',
    subtitle: 'Granular hourly & multi-day timeline',
    icon: '⏱️',
    priority: 'medium',
    reason: `Shown for complete timeline projection in ${activeLocationName}.`,
    route: 'Forecast',
    critical: false,
    visible: true,
  });

  // Ask MAUSAM Action
  candidateActions.push({
    id: 'action_ask_mausam',
    type: 'ask_mausam',
    title: 'Ask MAUSAM Assistant',
    subtitle: 'Interactive weather assistant query',
    icon: '💬',
    priority: 'medium',
    reason: 'Shown for instant interactive weather assistance.',
    route: 'AskMausam',
    critical: false,
    visible: true,
  });

  // Location Management Action
  candidateActions.push({
    id: 'action_locations',
    type: 'locations',
    title: 'Manage Saved Locations',
    subtitle: `Currently observing ${activeLocationName}`,
    icon: '📍',
    priority: 'low',
    reason: `Shown to easily switch weather context from ${activeLocationName}.`,
    route: 'Locations',
    critical: false,
    visible: true,
  });

  // Personalization Insights Action
  candidateActions.push({
    id: 'action_insights',
    type: 'insights',
    title: 'Why This Personalization?',
    subtitle: 'Explainable personalization rules & triggers',
    icon: '🧠',
    priority: 'low',
    reason: 'Shown to inspect transparent personalization rules.',
    route: 'PersonalizationInsights',
    critical: false,
    visible: true,
  });

  // =========================================================================
  // 6. DEDUPLICATION & SELECTION
  // Deduplicate by target route to prevent redundant navigation targets
  // =========================================================================
  const uniqueRouteActions: ContextualAction[] = [];
  const seenRoutes = new Set<string>();

  for (const action of candidateActions) {
    // Exception: If safety action is critical, allow it even if another alert action exists
    if (action.critical) {
      uniqueRouteActions.push(action);
      seenRoutes.add(action.route);
    } else if (!seenRoutes.has(action.route)) {
      uniqueRouteActions.push(action);
      seenRoutes.add(action.route);
    }
  }

  // Ensure critical safety action is at index 0 if present
  if (isSevere) {
    const safetyIdx = uniqueRouteActions.findIndex((a) => a.critical || a.type === 'safety');
    if (safetyIdx > 0) {
      const [safetyAction] = uniqueRouteActions.splice(safetyIdx, 1);
      uniqueRouteActions.unshift(safetyAction);
    }
  }

  // Cap at MAX_CONTEXTUAL_ACTIONS (5)
  return uniqueRouteActions.slice(0, MAX_CONTEXTUAL_ACTIONS);
}
