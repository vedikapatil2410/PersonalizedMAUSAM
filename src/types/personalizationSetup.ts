/**
 * Phase 20 — Personalization Setup Data Model
 * SIH26076 · PersonalizedMAUSAM
 *
 * Progress and summary state representation for the onboarding journey.
 */

import type { UserPersonaType, WeatherPreferenceType } from './index';

export interface PersonalizationSetup {
  completed: boolean;
  selectedPersonas: UserPersonaType[];
  selectedPreferences: WeatherPreferenceType[];
  selectedLocation: string;
  completedAt?: string;
}
