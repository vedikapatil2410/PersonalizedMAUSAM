/**
 * Phase 14 — Personalization Insights & Explainability Dashboard
 * SIH26076 · PersonalizedMAUSAM
 *
 * Data model for the observation/explanation layer.
 * This layer does NOT generate new recommendations or alerts.
 * It explains existing decisions made by Phases 5–13.
 */

import type { UserPersonaType, WeatherPreferenceType } from './index';
import type { RecommendationCategory, RecommendationPriority } from './personalization';
import type { AlertSeverityLevel, AlertCategory, AlertSource } from './alerts';

// ─── Insight Type Discriminant ────────────────────────────────────────────────

export type InsightType =
  | 'weather_trigger'   // A meteorological value crossed a configured threshold
  | 'persona_match'     // An active persona influenced the visible recommendations
  | 'preference_match'  // An active user preference is relevant to current conditions
  | 'recommendation'    // Explanation of a specific final recommendation on the homepage
  | 'safety_override'   // Phase 7 safety override is active
  | 'alert'             // Phase 12 alert explanation
  | 'notification';     // Phase 13 notification delivery decision explanation

// ─── Core Insight Model ───────────────────────────────────────────────────────

export interface PersonalizationInsight {
  /** Unique identifier for this insight (stable and deterministic). */
  id: string;

  /** Category of insight. */
  type: InsightType;

  /** Short human-readable title. */
  title: string;

  /** Full explanation of why this insight exists. */
  description: string;

  /**
   * Recommendation category this insight relates to (if applicable).
   * Null for persona/preference/safety insights without a direct recommendation link.
   */
  category: RecommendationCategory | AlertCategory | 'general' | null;

  /** Display priority for ordering the insights list. Lower = shown first. */
  displayOrder: number;

  /**
   * Source attribution (e.g. 'Official IMD', 'Personalized MAUSAM',
   * 'Preference Settings', 'Persona Configuration').
   */
  source: string;

  /** The underlying rule or trigger expressed in plain language. */
  explanation: string;

  /** What triggered this insight (e.g. 'Temperature 39°C ≥ 35°C threshold'). */
  triggeredBy: string | null;

  /** Persona ID if this insight is linked to a specific active persona. */
  relatedPersona: UserPersonaType | null;

  /** Persona label (human-readable). */
  relatedPersonaLabel: string | null;

  /** Preference ID if this insight is linked to an active preference. */
  relatedPreference: WeatherPreferenceType | null;

  /**
   * Recommendation priority if this insight wraps a recommendation insight.
   * Null for non-recommendation insight types.
   */
  priority: RecommendationPriority | AlertSeverityLevel | null;

  /** Whether this insight is safety-critical (cannot be suppressed by any setting). */
  isCritical: boolean;

  /** Emoji icon for UI display. */
  icon: string;
}

// ─── Personalization Summary ──────────────────────────────────────────────────

export interface PersonalizationSummary {
  /** Location being personalized for. */
  location: string;

  /** Active persona IDs. */
  activePersonas: UserPersonaType[];

  /** Active persona labels (human-readable). */
  activePersonaLabels: string[];

  /** Active preference IDs. */
  activePreferences: WeatherPreferenceType[];

  /** Active preference labels (human-readable). */
  activePreferenceLabels: string[];

  /** Current temperature in °C. */
  temperature: number;

  /** Weather condition label (e.g. 'Partly Cloudy'). */
  weatherConditionLabel: string;

  /** Current severity level. */
  severityLabel: string;

  /** Count of final recommendations shown on the homepage. */
  totalRecommendations: number;

  /** Count of active alerts from Phase 12. */
  totalAlerts: number;

  /** Count of alerts delivered as notifications under Phase 13 preferences. */
  deliveredNotifications: number;

  /** Whether the Phase 7 safety override is currently active. */
  safetyOverrideActive: boolean;

  /** Data mode in use ('live' or 'demo'). */
  dataMode: 'live' | 'demo';
}

// ─── Full Insight Report ──────────────────────────────────────────────────────

export interface PersonalizationInsightReport {
  summary: PersonalizationSummary;
  insights: PersonalizationInsight[];
  generatedAt: string;
}
