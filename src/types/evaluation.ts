// src/types/evaluation.ts
/**
 * Types for the Judge Evaluation Mode.
 * These models are deterministic and only reference existing domain types.
 */
import type { UserPersonaType, WeatherPreferenceType, WeatherData, WeatherDataMode, DemoScenarioId } from './index';

export type EvaluationScenario = {
  /** Identifier for the scenario (e.g., "Health + Normal") */
  id: string;
  /** Persona used for this evaluation */
  persona: UserPersonaType;
  /** Demo weather scenario identifier */
  weatherScenario: DemoScenarioId;
  /** Preferences selected for the user */
  preferences: WeatherPreferenceType[];
  /** Location name (matches a saved location) */
  location: string;
};

export type EvaluationMetric = {
  /** Total number of recommendations generated */
  totalRecommendations: number;
  /** Number of recommendations that are persona‑specific */
  personaRecommendations: number;
  /** Number of recommendations triggered by weather conditions */
  weatherRecommendations: number;
  /** Number of critical safety items (severity === 'severe') */
  criticalSafetyItems: number;
  /** Number of contextual actions produced */
  contextualActions: number;
  /** Whether the homepage ordering changed compared to a baseline */
  homepageOrderingChanged: boolean;
  /** Whether safety override became active */
  safetyOverrideActive: boolean;
};

export type EvaluationResult = {
  scenario: EvaluationScenario;
  metrics: EvaluationMetric;
  /** Optional textual evidence for quick display */
  evidence: Record<string, 'YES' | 'NO'>;
};

export type EvaluationSummary = {
  /** Overall result for a collection of scenarios */
  results: EvaluationResult[];
  /** Summary counts across all results */
  totals: EvaluationMetric;
};
