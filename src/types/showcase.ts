/**
 * Phase 21 — SIH Showcase / Demo Story Mode Data Models
 * SIH26076 · PersonalizedMAUSAM
 *
 * Types for judge demonstration scenarios, before/after comparisons,
 * and showcase state management.
 */

import type { UserPersonaType, WeatherPreferenceType, DemoScenarioId, WeatherDataMode } from './index';
import type { RootStackParamList } from '../navigation/types';

export interface ShowcaseScenario {
  id: string;
  name: string;
  persona: UserPersonaType;
  personaTitle: string;
  personaIcon: string;
  scenarioId: DemoScenarioId;
  weatherSummary: string;
  expectedChanges: string;
  reason: string;
  icon: string;
  isSevere?: boolean;
  isMultiPersona?: boolean;
}

export interface ShowcaseComparisonItem {
  id: string;
  genericText: string;
  personalizedTitle: string;
  personalizedText: string;
  persona: UserPersonaType;
  icon: string;
}

export interface ShowcaseState {
  isActive: boolean;
  activeScenarioId: string | null;
  originalPersonas: UserPersonaType[];
  originalPreferences: WeatherPreferenceType[];
  originalLocation: string;
  originalDataMode: WeatherDataMode;
  originalScenarioId: DemoScenarioId;
}
