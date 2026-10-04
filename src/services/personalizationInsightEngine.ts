/**
 * Phase 14 — Personalization Insight Engine
 * SIH26076 · PersonalizedMAUSAM
 *
 * OBSERVATION / EXPLANATION layer only.
 *
 * This engine transforms existing application state produced by Phases 5–13
 * into human-readable PersonalizationInsight objects.
 *
 * Rules:
 * - Does NOT generate new recommendations.
 * - Does NOT generate new alerts.
 * - Does NOT change recommendation priority or alert severity.
 * - Does NOT alter any input object.
 * - Does NOT fabricate unavailable IMD fields.
 * - Every insight must correspond to an actual existing state or result.
 * - Maintains deterministic, stable ordering.
 */

import type { WeatherData, WeatherDataMode, UserPersonaType, WeatherPreferenceType } from '../types';
import type { PersonalizedRecommendation } from '../types/personalization';
import type { WeatherAlert } from '../types/alerts';
import type { NotificationDeliveryDecision } from '../types/notifications';
import type {
  PersonalizationInsight,
  PersonalizationSummary,
  PersonalizationInsightReport,
} from '../types/personalizationInsights';
import { PERSONA_CATALOG } from '../constants/personas';
import { PREFERENCE_CATALOG } from '../constants/preferences';
import { isSafetyOverrideActive } from './safetyOverrideEngine';
import {
  HIGH_TEMPERATURE,
  VERY_HIGH_TEMPERATURE,
  HIGH_RAIN_PROBABILITY,
  HEAVY_RAINFALL,
  HIGH_WIND,
  HIGH_UV,
  VERY_HIGH_UV,
  LOW_VISIBILITY,
  HIGH_HUMIDITY,
} from '../constants/personalizationRules';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPersonaLabel(id: UserPersonaType): string {
  if (id === 'outdoor') return 'Beach & Outdoor';
  return PERSONA_CATALOG.find((p) => p.id === id)?.title ?? id;
}

function getPreferenceLabel(id: WeatherPreferenceType): string {
  return PREFERENCE_CATALOG.find((p) => p.id === id)?.title ?? id;
}

function conditionLabel(condition: string): string {
  const map: Record<string, string> = {
    clear: 'Clear Sky',
    partly_cloudy: 'Partly Cloudy',
    cloudy: 'Cloudy',
    rain: 'Rainy',
    thunderstorm: 'Thunderstorm',
    fog: 'Foggy',
    heat: 'Hot',
    severe: 'Severe Weather',
  };
  return map[condition] ?? condition;
}

function severityLabel(sev: string): string {
  const map: Record<string, string> = {
    normal: 'Normal Conditions',
    advisory: 'Advisory',
    warning: 'Warning',
    severe: 'Severe',
  };
  return map[sev] ?? sev;
}

// ─── Input Type ───────────────────────────────────────────────────────────────

export interface InsightEngineInput {
  weatherData: WeatherData;
  dataMode: WeatherDataMode;
  /** Active persona IDs from AppState */
  selectedPersonas: UserPersonaType[];
  /** Active preference IDs from AppState */
  selectedPreferences: WeatherPreferenceType[];
  /** Selected location string */
  selectedLocation: string;
  /** All candidate recommendations from Phase 5 (personalizationEngine) */
  rawRecommendations: PersonalizedRecommendation[];
  /** Final recommendations shown on homepage (post Phase 6 + Phase 7) */
  finalRecommendations: PersonalizedRecommendation[];
  /** Phase 12 alerts */
  alerts: WeatherAlert[];
  /** Phase 13 notification delivery decisions */
  notificationDecisions: NotificationDeliveryDecision[];
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Generates a deterministic PersonalizationInsightReport from existing pipeline state.
 *
 * Display order (lower = shown first):
 *  0: safety_override
 *  1: alert (critical)
 *  2: weather_trigger
 *  3: recommendation
 *  4: persona_match
 *  5: preference_match
 *  6: alert (non-critical)
 *  7: notification
 *  8: general / summary
 */
export function generatePersonalizationInsights(
  input: InsightEngineInput
): PersonalizationInsightReport {
  const {
    weatherData,
    dataMode,
    selectedPersonas,
    selectedPreferences,
    selectedLocation,
    rawRecommendations,
    finalRecommendations,
    alerts,
    notificationDecisions,
  } = input;

  const insights: PersonalizationInsight[] = [];

  const location =
    selectedLocation === 'Choose Later' ? weatherData.location : selectedLocation || weatherData.location;

  const safetyActive = isSafetyOverrideActive(weatherData);

  // ─── 1. Safety Override Insight ───────────────────────────────────────────
  if (safetyActive) {
    insights.push({
      id: 'insight_safety_override',
      type: 'safety_override',
      title: 'Safety Override Active',
      description:
        'Critical severe-weather information is shown regardless of your selected personas or notification preferences. This override is triggered automatically by official meteorological severity classifications.',
      category: 'safety',
      displayOrder: 0,
      source: 'Official IMD',
      explanation:
        `Weather severity is classified as "severe". Phase 7 Safety Override Engine guarantees that the critical safety recommendation appears at the top of your homepage feed, independent of any user configuration.`,
      triggeredBy: `Severity: Severe • Wind: ${weatherData.windSpeed} km/h`,
      relatedPersona: null,
      relatedPersonaLabel: null,
      relatedPreference: null,
      priority: 'critical',
      isCritical: true,
      icon: '🚨',
    });
  }

  // ─── 2. Critical Alert Insights ───────────────────────────────────────────
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  criticalAlerts.forEach((alert, i) => {
    insights.push({
      id: `insight_alert_critical_${i}`,
      type: 'alert',
      title: `Alert: ${alert.title}`,
      description: alert.message,
      category: alert.category,
      displayOrder: 1,
      source: alert.source,
      explanation: alert.explanation,
      triggeredBy: `Category: ${alert.category} • Source: ${alert.source}`,
      relatedPersona: (alert.persona as UserPersonaType | undefined) ?? null,
      relatedPersonaLabel: alert.persona ?? null,
      relatedPreference: null,
      priority: 'critical',
      isCritical: true,
      icon: '🚨',
    });
  });

  // ─── 3. Weather Trigger Insights ──────────────────────────────────────────
  // Only emit a trigger if it is actually measurable from this weatherData (no fabrication of IMD unavailable fields).

  // Temperature trigger
  if (weatherData.temperature >= HIGH_TEMPERATURE || weatherData.feelsLike >= 38) {
    insights.push({
      id: 'insight_trigger_temperature',
      type: 'weather_trigger',
      title: 'High Temperature Detected',
      description: `Current temperature is ${weatherData.temperature}°C (feels like ${weatherData.feelsLike}°C), which is at or above the configured heat advisory threshold of ${HIGH_TEMPERATURE}°C.`,
      category: 'health',
      displayOrder: 2,
      source: dataMode === 'live' ? 'Official IMD' : 'Personalized MAUSAM',
      explanation: `Temperature ${weatherData.temperature}°C ≥ threshold ${HIGH_TEMPERATURE}°C. This triggered heat-related advisories in the personalization engine.`,
      triggeredBy: `Temperature ${weatherData.temperature}°C • Feels like ${weatherData.feelsLike}°C`,
      relatedPersona: null,
      relatedPersonaLabel: null,
      relatedPreference: 'temperature',
      priority: weatherData.temperature >= VERY_HIGH_TEMPERATURE ? 'high' : 'medium',
      isCritical: false,
      icon: '🌡️',
    });
  }

  // Rain trigger — only when rainfall or rainProbability is genuinely > 0
  const hasRainCondition =
    weatherData.weatherCondition === 'rain' ||
    weatherData.weatherCondition === 'thunderstorm' ||
    (weatherData.rainProbability >= HIGH_RAIN_PROBABILITY && weatherData.rainProbability > 0) ||
    (weatherData.rainfall >= 15 && weatherData.rainfall > 0);

  if (hasRainCondition) {
    const rainfallAvailable = weatherData.rainfall > 0;
    const rainProbAvailable = weatherData.rainProbability > 0;
    const triggerDetail = [
      weatherData.weatherCondition === 'rain' || weatherData.weatherCondition === 'thunderstorm'
        ? `Condition: ${conditionLabel(weatherData.weatherCondition)}`
        : null,
      rainProbAvailable ? `Rain probability: ${weatherData.rainProbability}%` : null,
      rainfallAvailable ? `Rainfall: ${weatherData.rainfall} mm` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    insights.push({
      id: 'insight_trigger_rain',
      type: 'weather_trigger',
      title: 'Precipitation Conditions Detected',
      description:
        rainfallAvailable || rainProbAvailable
          ? `Rain-related conditions are present: ${triggerDetail}. Rainfall or high probability of precipitation triggered commute, travel, and outdoor advisories.`
          : `Weather condition is classified as "${conditionLabel(weatherData.weatherCondition)}", indicating rain-related conditions.`,
      category: 'commuting',
      displayOrder: 2,
      source: dataMode === 'live' ? 'Official IMD' : 'Personalized MAUSAM',
      explanation: `Rain-related weather triggered relevant personalized recommendations.`,
      triggeredBy: triggerDetail || conditionLabel(weatherData.weatherCondition),
      relatedPersona: null,
      relatedPersonaLabel: null,
      relatedPreference: 'rainfall',
      priority: weatherData.rainfall >= HEAVY_RAINFALL ? 'high' : 'medium',
      isCritical: false,
      icon: '🌧️',
    });
  }

  // UV trigger — only when uvIndex > 0 (i.e., genuinely available)
  if (weatherData.uvIndex >= HIGH_UV && weatherData.uvIndex > 0) {
    insights.push({
      id: 'insight_trigger_uv',
      type: 'weather_trigger',
      title: 'High UV Radiation Detected',
      description: `UV Index is ${weatherData.uvIndex}, which is at or above the configured advisory threshold of ${HIGH_UV}. Skin protection and outdoor timing advisories are active.`,
      category: 'health',
      displayOrder: 2,
      source: dataMode === 'live' ? 'Official IMD' : 'Personalized MAUSAM',
      explanation: `UV Index ${weatherData.uvIndex} ≥ threshold ${HIGH_UV}. Triggered UV-related health and outdoor recommendations.`,
      triggeredBy: `UV Index: ${weatherData.uvIndex}${weatherData.uvIndex >= VERY_HIGH_UV ? ' (Extreme)' : ' (Very High)'}`,
      relatedPersona: null,
      relatedPersonaLabel: null,
      relatedPreference: 'uv_index',
      priority: weatherData.uvIndex >= VERY_HIGH_UV ? 'high' : 'medium',
      isCritical: false,
      icon: '☀️',
    });
  }

  // Wind trigger
  if (weatherData.windSpeed >= HIGH_WIND) {
    insights.push({
      id: 'insight_trigger_wind',
      type: 'weather_trigger',
      title: 'High Wind Speed Detected',
      description: `Wind speed is ${weatherData.windSpeed} km/h${weatherData.windDirection ? ` from ${weatherData.windDirection}` : ''}, above the advisory threshold of ${HIGH_WIND} km/h.`,
      category: 'travel',
      displayOrder: 2,
      source: dataMode === 'live' ? 'Official IMD' : 'Personalized MAUSAM',
      explanation: `Wind ${weatherData.windSpeed} km/h ≥ threshold ${HIGH_WIND} km/h. Triggered travel and outdoor wind advisories.`,
      triggeredBy: `Wind: ${weatherData.windSpeed} km/h ${weatherData.windDirection}`,
      relatedPersona: null,
      relatedPersonaLabel: null,
      relatedPreference: 'wind',
      priority: weatherData.windSpeed >= 50 ? 'high' : 'medium',
      isCritical: false,
      icon: '💨',
    });
  }

  // Humidity trigger
  if (
    weatherData.humidity >= HIGH_HUMIDITY &&
    weatherData.temperature >= 26 &&
    weatherData.weatherCondition !== 'rain' &&
    weatherData.weatherCondition !== 'thunderstorm' &&
    weatherData.severity !== 'severe'
  ) {
    insights.push({
      id: 'insight_trigger_humidity',
      type: 'weather_trigger',
      title: 'High Humidity Detected',
      description: `Humidity is ${weatherData.humidity}% with temperature ${weatherData.temperature}°C, causing elevated heat stress even without direct sunlight.`,
      category: 'health',
      displayOrder: 2,
      source: dataMode === 'live' ? 'Official IMD' : 'Personalized MAUSAM',
      explanation: `Humidity ${weatherData.humidity}% ≥ threshold ${HIGH_HUMIDITY}%. Triggered humidity-related health advisories.`,
      triggeredBy: `Humidity: ${weatherData.humidity}% • Temp: ${weatherData.temperature}°C`,
      relatedPersona: null,
      relatedPersonaLabel: null,
      relatedPreference: 'humidity',
      priority: 'medium',
      isCritical: false,
      icon: '💧',
    });
  }

  // Visibility trigger — only when visibility > 0 (genuinely available)
  if (
    (weatherData.visibility <= LOW_VISIBILITY && weatherData.visibility > 0) ||
    weatherData.weatherCondition === 'fog'
  ) {
    const visAvailable = weatherData.visibility > 0;
    insights.push({
      id: 'insight_trigger_visibility',
      type: 'weather_trigger',
      title: 'Reduced Visibility Detected',
      description: visAvailable
        ? `Visibility is ${weatherData.visibility} km, below the advisory threshold of ${LOW_VISIBILITY} km. This can affect safe road and aviation conditions.`
        : `Weather condition is classified as fog, indicating reduced visibility.`,
      category: 'commuting',
      displayOrder: 2,
      source: dataMode === 'live' ? 'Official IMD' : 'Personalized MAUSAM',
      explanation: `Reduced visibility conditions triggered travel and commuting advisories.`,
      triggeredBy: visAvailable
        ? `Visibility: ${weatherData.visibility} km`
        : `Condition: ${conditionLabel(weatherData.weatherCondition)}`,
      relatedPersona: null,
      relatedPersonaLabel: null,
      relatedPreference: 'visibility',
      priority: 'medium',
      isCritical: false,
      icon: '🌫️',
    });
  }

  // ─── 4. Recommendation Insights ───────────────────────────────────────────
  // One insight per final recommendation — explains why it appeared on the homepage.
  finalRecommendations.forEach((rec, i) => {
    const linkedPersona =
      rec.relevantPersonas.length > 0
        ? (rec.relevantPersonas[0] as UserPersonaType)
        : null;
    const linkedPersonaLabel =
      rec.relevantPersonaLabels.length > 0 ? rec.relevantPersonaLabels[0] : null;

    insights.push({
      id: `insight_rec_${String(i).padStart(3, '0')}_${rec.id}`,
      type: 'recommendation',
      title: rec.title,
      description: rec.description,
      category: rec.category,
      displayOrder: 3,
      source:
        rec.priority === 'critical' || rec.category === 'safety_alert'
          ? 'Official IMD'
          : 'Personalized MAUSAM',
      explanation: rec.explanation,
      triggeredBy: rec.weatherTrigger,
      relatedPersona: linkedPersona,
      relatedPersonaLabel: linkedPersonaLabel,
      relatedPreference: null,
      priority: rec.priority,
      isCritical: rec.priority === 'critical',
      icon: rec.icon,
    });
  });

  // ─── 5. Persona Match Insights ────────────────────────────────────────────
  // For each active persona, explain how it is reflected in the current recommendations.
  selectedPersonas.forEach((personaId) => {
    const label = getPersonaLabel(personaId);

    // Find final recommendations linked to this persona
    const linkedRecs = finalRecommendations.filter((r) =>
      r.relevantPersonas.includes(personaId)
    );

    const rawLinkedRecs = rawRecommendations.filter((r) =>
      r.relevantPersonas.includes(personaId)
    );

    let description: string;
    if (linkedRecs.length > 0) {
      description = `The ${label} persona is active and influenced ${linkedRecs.length} recommendation${linkedRecs.length > 1 ? 's' : ''} on your homepage: ${linkedRecs.map((r) => `"${r.title}"`).join(', ')}.`;
    } else if (rawLinkedRecs.length > 0) {
      description = `The ${label} persona generated ${rawLinkedRecs.length} candidate recommendation${rawLinkedRecs.length > 1 ? 's' : ''} from current weather. ${rawLinkedRecs.length - linkedRecs.length} were filtered by the Decision Engine (feed capacity limit).`;
    } else {
      description = `The ${label} persona is active. Current weather conditions did not trigger any ${label}-specific recommendations, so your homepage reflects general conditions.`;
    }

    insights.push({
      id: `insight_persona_${personaId}`,
      type: 'persona_match',
      title: `Persona Active: ${label}`,
      description,
      category: null,
      displayOrder: 4,
      source: 'Persona Configuration',
      explanation: `${label} persona is selected in your profile. The personalization engine considers ${label}-specific weather thresholds when evaluating current conditions.`,
      triggeredBy: null,
      relatedPersona: personaId,
      relatedPersonaLabel: label,
      relatedPreference: null,
      priority: null,
      isCritical: false,
      icon: '👤',
    });
  });

  // ─── 6. Preference Match Insights ────────────────────────────────────────
  selectedPreferences.forEach((prefId) => {
    const label = getPreferenceLabel(prefId);

    // Only emit a preference insight if the field is actually measurable/available
    let isFieldActive = true;
    let unavailableNote = '';

    if (prefId === 'uv_index' && weatherData.uvIndex === 0 && dataMode === 'live') {
      isFieldActive = false;
      unavailableNote = ' (UV Index is currently unavailable from the Live IMD station.)';
    }
    if (prefId === 'rainfall' && weatherData.rainfall === 0 && weatherData.rainProbability === 0 && dataMode === 'live') {
      isFieldActive = false;
      unavailableNote = ' (Rainfall data is currently unavailable from the Live IMD station.)';
    }
    if (prefId === 'visibility' && weatherData.visibility === 0 && dataMode === 'live') {
      isFieldActive = false;
      unavailableNote = ' (Visibility data is currently unavailable from the Live IMD station.)';
    }

    insights.push({
      id: `insight_pref_${prefId}`,
      type: 'preference_match',
      title: `Preference: ${label}`,
      description: isFieldActive
        ? `You have enabled the "${label}" preference, so ${label.toLowerCase()}-related information can be considered when personalizing your homepage.`
        : `You have enabled the "${label}" preference.${unavailableNote} Recommendations based on this field are omitted to avoid fabricating unavailable data.`,
      category: null,
      displayOrder: 5,
      source: 'Preference Settings',
      explanation: isFieldActive
        ? `"${label}" is enabled in your preference settings.`
        : `"${label}" is enabled but the field is unavailable from the current Live IMD data source.`,
      triggeredBy: null,
      relatedPersona: null,
      relatedPersonaLabel: null,
      relatedPreference: prefId,
      priority: null,
      isCritical: false,
      icon: '⚙️',
    });
  });

  // ─── 7. Non-Critical Alert Insights ──────────────────────────────────────
  const nonCriticalAlerts = alerts.filter((a) => a.severity !== 'critical');
  nonCriticalAlerts.forEach((alert, i) => {
    insights.push({
      id: `insight_alert_noncritical_${i}`,
      type: 'alert',
      title: `Alert: ${alert.title}`,
      description: alert.message,
      category: alert.category,
      displayOrder: 6,
      source: alert.source,
      explanation: alert.explanation,
      triggeredBy: alert.persona ? `Persona: ${alert.persona}` : `Category: ${alert.category}`,
      relatedPersona: (alert.persona as UserPersonaType | undefined) ?? null,
      relatedPersonaLabel: alert.persona ?? null,
      relatedPreference: null,
      priority: alert.severity,
      isCritical: false,
      icon: alert.severity === 'high' ? '⚠️' : alert.severity === 'medium' ? 'ℹ️' : '💡',
    });
  });

  // ─── 8. Notification Decision Insights ───────────────────────────────────
  notificationDecisions.forEach((decision, i) => {
    const isCrit = decision.rule === 'critical_safety_override';
    insights.push({
      id: `insight_notif_${i}`,
      type: 'notification',
      title: decision.delivered
        ? `Notification: "${decision.alert.title}" — Delivered`
        : `Notification: "${decision.alert.title}" — Suppressed`,
      description: decision.reason,
      category: decision.alert.category,
      displayOrder: 7,
      source: 'Notification Preferences',
      explanation: isCrit
        ? 'Critical safety alerts are always delivered regardless of notification preferences or quiet hours.'
        : decision.delivered
        ? `This alert satisfies your current notification preferences (rule: ${decision.rule}).`
        : `This alert was suppressed by your notification preferences (rule: ${decision.rule}).`,
      triggeredBy: `Rule: ${decision.rule}`,
      relatedPersona: null,
      relatedPersonaLabel: null,
      relatedPreference: null,
      priority: decision.alert.severity,
      isCritical: isCrit,
      icon: decision.delivered ? '🔔' : '🔕',
    });
  });

  // ─── Build Summary ────────────────────────────────────────────────────────
  const summary: PersonalizationSummary = {
    location,
    activePersonas: selectedPersonas,
    activePersonaLabels: selectedPersonas.map(getPersonaLabel),
    activePreferences: selectedPreferences,
    activePreferenceLabels: selectedPreferences.map(getPreferenceLabel),
    temperature: weatherData.temperature,
    weatherConditionLabel: conditionLabel(weatherData.weatherCondition),
    severityLabel: severityLabel(weatherData.severity),
    totalRecommendations: finalRecommendations.length,
    totalAlerts: alerts.length,
    deliveredNotifications: notificationDecisions.filter((d) => d.delivered).length,
    safetyOverrideActive: safetyActive,
    dataMode,
  };

  return {
    summary,
    insights: insights.sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id)),
    generatedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}
